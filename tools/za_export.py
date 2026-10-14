# Exports chosen objects of the Z-Anatomy Blender file as triangle meshes.
#   blender -b .cache/zanatomy/Z-Anatomy/Startup.blend --python tools/za_export.py -- <out dir>
# Curves (vessels, nerves) are evaluated with their bevel into closed tubes. Coordinates stay in
# Z-Anatomy's own frame (metres); build_model.py fits them onto BodyParts3D by matching bones.
import bpy, sys, os, re, json
import numpy as np

out = sys.argv[sys.argv.index("--") + 1]
os.makedirs(os.path.join(out, "obj"), exist_ok=True)

# Collections whose contents we want, and what to take from each.
WANT = [
    ("5: Cardiovascular system", "CURVE", None),
    ("7: Nervous system & Sense organs", "CURVE", None),
    ("6: Lymphoid organs", "MESH", re.compile(r"nodes?\b", re.I)),
    ("8: Visceral systems", "MESH", re.compile(r"^(Thyroid gland|Inferior parathyroid gland|Superior parathyroid gland|Parotid gland|\(Accessory parotid gland\)|Submandibular gland|Sublingual gland|Tongue|Epiglottis|Soft palate|Uvula of palate|Nasopharynx|Oropharynx|Laryngopharynx|Pleura|Greater omentum|(Anterior|Posterior) (lateral|medial) segment of liver.*|Left (anterior|posterior) lateral segment of liver.*|Left medial segment of liver.*|Posterior segment of liver.*)(\.[lr])?$")),
    ("7: Nervous system & Sense organs", "MESH", re.compile(r"^(Iris|Cornea|Lens|Spinal cord.*|Medulla spinalis.*|Cauda equina.*|Lacrimal gland|Falx cerebri|Tentorium cerebelli)(\.[lr])?$", re.I)),
]
# Bones for fitting the two frames together.
BONES = ["Femur.r", "Femur.l", "Humerus.r", "Humerus.l", "Tibia.r", "Tibia.l", "Hip bone.r", "Hip bone.l", "Sacrum", "Manubrium of sternum", "Clavicle.r", "Clavicle.l", "Mandible", "Frontal bone", "Scapula.r", "Scapula.l", "Patella.r", "Patella.l", "Calcaneus.r", "Calcaneus.l", "Radius.r", "Radius.l", "Ulna.r", "Ulna.l", "Occipital bone"]


def members(col):
    for o in col.objects:
        yield o
    for c in col.children:
        yield from members(c)


def top(name):
    for c in bpy.context.scene.collection.children:
        if c.name == name:
            return c
    raise SystemExit("no collection " + name)


chosen = {}
for colname, kind, pattern in WANT:
    for o in members(top(colname)):
        if o.type != kind or o.name.endswith(".j") or o.name.endswith(".g"):
            continue
        if pattern and not pattern.search(o.name):
            continue
        chosen[o.name] = (o, colname)
for name in BONES:
    o = bpy.data.objects.get(name)
    if o:
        chosen[name] = (o, "bones")
print("chosen", len(chosen))

graph = bpy.context.evaluated_depsgraph_get()
for o, _ in chosen.values():
    if o.type == "CURVE":
        c = o.data
        if c.bevel_depth <= 0 and c.bevel_mode == "ROUND" and not c.bevel_object:
            c.bevel_depth = 0.0007
        c.bevel_resolution = max(c.bevel_resolution, 3)
        c.resolution_u = max(c.resolution_u, 6)
        c.use_fill_caps = True
graph.update()

index = []
safe = lambda s: re.sub(r"[^A-Za-z0-9._-]+", "_", s)[:120]
for name, (o, colname) in chosen.items():
    try:
        e = o.evaluated_get(graph)
        m = e.to_mesh()
    except Exception as error:
        print("skip", name, error)
        continue
    if m is None or len(m.polygons) == 0:
        if m is not None:
            e.to_mesh_clear()
        continue
    m.calc_loop_triangles()
    nv = len(m.vertices)
    co = np.empty(nv * 3, np.float32)
    m.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    mw = np.array(o.matrix_world, np.float64)
    co = (co @ mw[:3, :3].T + mw[:3, 3]).astype(np.float32)
    tri = np.empty(len(m.loop_triangles) * 3, np.int32)
    m.loop_triangles.foreach_get("vertices", tri)
    e.to_mesh_clear()
    file = safe(name) + ".npz"
    np.savez_compressed(os.path.join(out, "obj", file), co=co, tri=tri.reshape(-1, 3))
    index.append({"name": name, "file": file, "type": o.type, "collection": colname, "verts": int(nv), "tris": int(len(tri) // 3)})
json.dump(index, open(os.path.join(out, "index.json"), "w", encoding="utf8"), ensure_ascii=False, indent=0)
print("exported", len(index))
