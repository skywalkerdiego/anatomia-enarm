# Writes every object of chosen Z-Anatomy collections (recursively) to za_objects.tsv:
# collection path, object name, type, vertex/point count.
import bpy, sys
out = open(sys.argv[sys.argv.index("--") + 1], "w", encoding="utf8")
def walk(col, path):
    for o in col.objects:
        n = len(o.data.vertices) if o.type == "MESH" else (sum(len(s.points) + len(s.bezier_points) for s in o.data.splines) if o.type == "CURVE" else 0)
        bev = getattr(o.data, "bevel_depth", 0) if o.type == "CURVE" else 0
        out.write(f"{path}\t{o.name}\t{o.type}\t{n}\t{bev:.5f}\n")
    for c in col.children:
        walk(c, path + "/" + c.name)
for top in bpy.context.scene.collection.children:
    walk(top, top.name)
out.close()
