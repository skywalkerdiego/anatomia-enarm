# Renders the female organs against this body's pelvis (Blender Workbench) for a quick look.
#   blender --background --factory-startup --python tools/female_preview.py -- <out dir>
import bpy, sys, os, importlib
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import female, rawbody
importlib.reload(female)

out_dir = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "."
os.makedirs(out_dir, exist_ok=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)

body = rawbody.RawBody("mujer")
cache = {}
def get(sid):
    if sid not in cache:
        co, tri, part = body.mesh(sid)
        cache[sid] = {"co": co, "tri": tri, "part": part, "names": [p["n"] for p in body.by_id[sid]["parts"]]}
    return cache[sid]

bl, ur = female.reshape_bladder(get("vejiga")["co"], get("ureteres")["co"])
get("vejiga")["co"] = bl
get("ureteres")["co"] = ur
L = female.landmarks(get)
intro = female.introitus_from(get("piel")["co"], L["sym_bottom"])
import time; T0 = time.time()
print("start", flush=True)
organs, L, corner, ovary = female.pelvic_organs(get, intro)
print("pelvic organs %.1fs" % (time.time() - T0), flush=True)
female.gonadal_vessels(get, ovary, organs)
rng = np.random.default_rng(5)
mam = []
for s, nip in female.nipples_from(get("piel")["co"]).items():
    inward = [-s * 0.2, 1.0, 0.12]
    depth = female.chest_depth(nip, inward, get("m-pectorales")["co"])
    print("breast depth", s, round(depth, 1), flush=True)
    female.mammary(nip, inward, rng, mam, depth)
organs["mamas"] = mam
print("mammary %.1fs" % (time.time() - T0), flush=True)
print("landmarks", {k: (np.round(v, 1).tolist() if hasattr(v, "shape") and v.shape == (3,) else v) for k, v in L.items() if not k.startswith(("ext_", "int_"))})
print("introitus", intro)

COL = {"vejiga": (0.95, 0.85, 0.45), "recto": (0.8, 0.5, 0.45), "pelvis": (0.85, 0.82, 0.75), "sacro": (0.85, 0.82, 0.75),
       "art-iliacas": (0.85, 0.15, 0.12), "ven-iliacas": (0.2, 0.3, 0.8), "ureteres": (0.95, 0.75, 0.3), "aorta": (0.85, 0.15, 0.12), "vci": (0.2, 0.3, 0.8),
       "utero": (0.85, 0.42, 0.45), "vagina": (0.9, 0.55, 0.55), "ovarios": (0.95, 0.85, 0.8), "trompas": (0.95, 0.6, 0.55),
       "vasos-gonadales": (0.9, 0.1, 0.1), "ven-gonadales": (0.15, 0.25, 0.85), "mamas": (0.93, 0.76, 0.68), "costillas": (0.85, 0.82, 0.75), "m-pectorales": (0.65, 0.2, 0.18),
       "esternon": (0.85, 0.82, 0.75)}
def add(name, co, tri, col):
    me = bpy.data.meshes.new(name)
    me.from_pydata(np.asarray(co).tolist(), [], np.asarray(tri).tolist())
    me.update()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    ob.color = (*col, 1)
    bpy.context.scene.collection.objects.link(ob)
    return ob
groups = {}
for sid in ["vejiga", "recto", "pelvis", "sacro", "art-iliacas", "ven-iliacas", "ureteres", "costillas", "m-pectorales", "esternon"]:
    g = get(sid)
    groups[sid] = [add(sid, g["co"], g["tri"], COL[sid])]
for sid, pieces in organs.items():
    groups[sid] = [add(f"{sid}:{n}", c, t, COL[sid]) for n, c, _, t in pieces]

sc = bpy.context.scene
# Cycles on the CPU: the GPU engines hang in background mode on this machine.
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 24
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 3
sc.render.resolution_x = sc.render.resolution_y = 800
mat = bpy.data.materials.new("by-object")
mat.use_nodes = True
nt = mat.node_tree
info = nt.nodes.new("ShaderNodeObjectInfo")
bsdf = nt.nodes["Principled BSDF"]
nt.links.new(info.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.45
for ob in sc.objects:
    if ob.type == "MESH":
        ob.data.materials.append(mat)
world = bpy.data.worlds.new("w"); sc.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.05, 0.06, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
for d, e in (((-0.5, -0.8, 0.6), 3.5), ((0.7, 0.3, 0.4), 1.5), ((0.2, 0.9, 0.3), 1.2)):
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = e
    sun.rotation_euler = (-Vector(d)).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(sun)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
sc.collection.objects.link(cam)
sc.camera = cam
cam.data.type = "ORTHO"

def shot(name, show, target, eye_dir, scale):
    for sid, obs in groups.items():
        for ob in obs:
            ob.hide_render = sid not in show
    t = Vector(target)
    cam.location = t + Vector(eye_dir).normalized() * 800
    cam.rotation_euler = (t - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.ortho_scale = scale
    cam.data.clip_end = 3000
    sc.render.filepath = os.path.join(out_dir, name + ".png")
    print("render", name, flush=True)
    bpy.ops.render.render(write_still=True)

pelvic = ["vejiga", "recto", "pelvis", "sacro", "art-iliacas", "ven-iliacas", "ureteres", "utero", "vagina", "ovarios", "trompas", "vasos-gonadales", "ven-gonadales"]
centre = (0, 25, 800)
shot("fem-front", pelvic, centre, (0, -1, 0.25), 230)
shot("fem-side", [s for s in pelvic if s != "pelvis"] + ["sacro"], centre, (1, 0, 0.05), 230)
shot("fem-top", [s for s in pelvic if s not in ("pelvis",)], centre, (0.3, -0.6, 1), 200)
shot("fem-organs", ["utero", "vagina", "ovarios", "trompas", "vasos-gonadales", "ven-gonadales"], (0, 25, 810), (0.35, -1, 0.45), 170)
chest = ["costillas", "m-pectorales", "esternon", "mamas"]
z_n = float(np.mean([n[2] for n in female.nipples_from(get("piel")["co"]).values()]))
shot("fem-mama", chest, (0, -60, z_n), (0.25, -1, 0.15), 380)
shot("fem-mama-side", chest, (90, -60, z_n), (1, -0.2, 0.05), 260)
print("done")
