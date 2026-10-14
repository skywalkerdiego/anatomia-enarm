# The heart's long axis (base → apex) from a built body, written into its meta files.
#   python tools/heart_axis.py hombre mujer
# The apex is the point furthest to the left, front and bottom; the base is the centre of the
# opposite end. A principal axis alone is ambiguous for a heart this round.
import sys, json, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def heart_axis(co):
    c = co.mean(axis=0)
    guess = np.array([0.6, -0.45, -0.65]); guess /= np.linalg.norm(guess)
    t = (co - c) @ guess
    apex = co[t >= np.percentile(t, 99.5)].mean(axis=0)
    base = co[t <= np.percentile(t, 12)].mean(axis=0)
    axis = apex - base
    length = float(np.linalg.norm(axis))
    axis /= length
    along = (co - base) @ axis
    return {"base": [round(float(x), 1) for x in base + axis * min(0.0, float(along.min()))], "axis": [round(float(x), 4) for x in axis], "length": round(float(along.max() - min(0.0, float(along.min()))), 1)}


if __name__ == "__main__":
    for name in sys.argv[1:]:
        meta_path = os.path.join(ROOT, ".cache", "models", name, "meta.json")
        meta = json.load(open(meta_path, encoding="utf8"))
        s = next(s for s in meta["structs"] if s["id"] == "corazon")
        raw = np.fromfile(os.path.join(ROOT, ".cache", "models", name, "raw.bin"), dtype=np.uint8)
        vo, vl, nv = s["v"]
        q = raw[vo:vo + vl].view(np.uint16).reshape(nv, 8)[:, :3].astype(np.float64)
        co = np.array(meta["lo"]) + q / 65535 * np.array(meta["size"])
        meta["heart"] = heart_axis(co)
        json.dump(meta, open(meta_path, "w", encoding="utf8"), separators=(",", ":"))
        src = os.path.join(ROOT, "src", "models", name + ".json")
        if os.path.exists(src):
            packed = json.load(open(src, encoding="utf8"))
            packed["heart"] = meta["heart"]
            json.dump(packed, open(src, "w", encoding="utf8"), separators=(",", ":"))
        print(name, meta["heart"])
