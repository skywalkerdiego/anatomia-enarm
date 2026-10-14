# Fits Z-Anatomy's frame onto BodyParts3D's (scale, rotation, translation) from bones present
# in both, and writes the transform to .cache/za/align.json.
#   blender -b --factory-startup --python tools/za_align.py
import os, json, struct
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STL = os.path.join(ROOT, ".cache", "bp3d", "stl")
ZA = os.path.join(ROOT, ".cache", "za")
idx = {e["name"]: e["id"] for e in json.load(open(os.path.join(ROOT, ".cache", "bp3d", "stl-index.json"), encoding="utf8"))}
PAIRS = {"Femur.r": "right femur", "Femur.l": "left femur", "Humerus.r": "right humerus", "Humerus.l": "left humerus", "Tibia.r": "right tibia", "Tibia.l": "left tibia", "Hip bone.r": "right hip bone", "Hip bone.l": "left hip bone", "Sacrum": "sacrum", "Manubrium of sternum": "manubrium", "Clavicle.r": "right clavicle", "Clavicle.l": "left clavicle", "Mandible": "mandible", "Frontal bone": "frontal bone", "Scapula.r": "right scapula", "Scapula.l": "left scapula", "Patella.r": "right patella", "Patella.l": "left patella", "Calcaneus.r": "right calcaneus", "Calcaneus.l": "left calcaneus", "Radius.r": "right radius", "Radius.l": "left radius", "Ulna.r": "right ulna", "Ulna.l": "left ulna", "Occipital bone": "occipital bone"}
safe = lambda s: "".join(ch if ch.isalnum() or ch in "._-" else "_" for ch in s)[:120]
def stl_points(fid):
    raw = np.fromfile(os.path.join(STL, fid + ".stl"), dtype=np.uint8)
    n = int(raw[80:84].view("<u4")[0])
    rec = np.frombuffer(raw[84:84 + n * 50].tobytes(), dtype=np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")]))
    return rec["v"].reshape(-1, 3).astype(np.float64)
A, B, names = [], [], []
for za, bp in PAIRS.items():
    f = os.path.join(ZA, "obj", safe(za) + ".npz")
    if not os.path.exists(f) or bp not in idx:
        print("missing", za, bp); continue
    z = np.load(f)["co"].astype(np.float64)
    b = stl_points(idx[bp])
    # Match centroids and the ends of each bone's longest axis.
    for pts, dst in ((z, A), (b, B)):
        c = pts.mean(axis=0)
        u = np.linalg.svd(pts - c, full_matrices=False)[2][0]
        if u[2] < 0: u = -u
        t = (pts - c) @ u
        dst += [c, c + u * np.percentile(t, 98), c + u * np.percentile(t, 2)]
    names.append(za)
A, B = np.array(A), np.array(B)
ma, mb = A.mean(axis=0), B.mean(axis=0)
X, Y = A - ma, B - mb
U, Sg, Vt = np.linalg.svd(Y.T @ X)
d = np.sign(np.linalg.det(U @ Vt))
R = U @ np.diag([1, 1, d]) @ Vt
s = (Sg * np.array([1, 1, d])).sum() / (X ** 2).sum()
t = mb - s * R @ ma
res = np.linalg.norm((s * (R @ A.T)).T + t - B, axis=1)
print("pairs", len(names), "scale %.3f" % s, "residual mm: median %.1f max %.1f" % (np.median(res), res.max()))
print("R", np.round(R, 4).tolist(), "t", np.round(t, 1).tolist())
json.dump({"s": s, "R": R.tolist(), "t": t.tolist(), "median": float(np.median(res)), "max": float(res.max())}, open(os.path.join(ZA, "align.json"), "w"))
