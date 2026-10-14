# blender -b <Startup.blend> --python tools/za_inspect.py
# Lists the collections of the Z-Anatomy file, with object counts and sample names.
import bpy, collections
def walk(col, depth=0):
    meshes = [o for o in col.objects if o.type == "MESH"]
    print("  " * depth + f"[{col.name}] objetos={len(col.objects)} mallas={len(meshes)}" + (" ej: " + "; ".join(o.name for o in meshes[:4]) if meshes else ""))
    for c in col.children:
        if depth < 3:
            walk(c, depth + 1)
walk(bpy.context.scene.collection)
types = collections.Counter(o.type for o in bpy.data.objects)
print("tipos:", dict(types))
for name in ["Femur.r", "Femur.l", "Right femur", "Femur", "Sternum", "Manubrium of sternum"]:
    o = bpy.data.objects.get(name)
    if o:
        import mathutils
        bb = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
        print(name, "min", [round(min(v[i] for v in bb), 4) for i in range(3)], "max", [round(max(v[i] for v in bb), 4) for i in range(3)])
nerves = [o.name for o in bpy.data.objects if o.type == "MESH" and "nerve" in o.name.lower()]
print("nervios (nombre con 'nerve'):", len(nerves))
print("; ".join(sorted(nerves)[:120]))
