# Builds the two bodies (hombre, mujer) for the page.
#
#   blender --background --factory-startup --python tools/build_model.py -- [--only hombre] [--fresh] [--ao 16]
#
# Sources: BodyParts3D 3.0 meshes (skeleton, organs, muscles, the main vessels), Z-Anatomy objects
# (the vessels and nerves of the whole body, lymph nodes, glands) fitted onto the same frame, and,
# for the female body, the male one reshaped plus organs modelled here (uterus, tubes, ovaries,
# vagina, mammary glands, their vessels).
#
# Each structure is decimated per part with Blender's Decimate modifier. Per vertex we bake:
# short-range ambient occlusion, a flow coordinate (mm along a vessel, airway, gut or nerve from
# where its contents enter), the thickness of the part (for light through thin tissue), and the
# part's long axis (muscle fibre direction) with the position along it (tendons at the ends).
#
# Output per body: .cache/models/<body>/raw.bin + meta.json; tools/pack.mjs compresses them.
import bpy, sys, os, re, json, math, time, heapq
import numpy as np
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from heart_axis import heart_axis
import female

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache")
STL = os.path.join(CACHE, "bp3d", "stl")
DEC = os.path.join(CACHE, "bp3d", "dec3")
ZA = os.path.join(CACHE, "za")
OUT = os.path.join(CACHE, "models")
os.makedirs(DEC, exist_ok=True)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = lambda name, default: (argv[argv.index(name) + 1] if name in argv else default)
ONLY = opt("--only", "")
FRESH = "--fresh" in argv
AO_RAYS = int(opt("--ao", 16))
AO_REACH = 28.0
MIN_PART = 40
AXIS_Y = -105.0
T0 = time.time()
log = lambda *a: print("[%6.1fs]" % (time.time() - T0), *a, flush=True)

parts = json.load(open(os.path.join(CACHE, "bp3d", "parts.json"), encoding="utf8"))
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj)

# ── mesh helpers ────────────────────────────────────────────────────────────
def read_stl(path):
    raw = np.fromfile(path, dtype=np.uint8)
    n = int(raw[80:84].view("<u4")[0])
    rec = np.frombuffer(raw[84:84 + n * 50].tobytes(), dtype=np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")]))
    return np.ascontiguousarray(rec["v"].reshape(-1, 3))


def weld(v):
    v = np.ascontiguousarray(v.astype(np.float32))
    key = v.view(np.dtype((np.void, v.dtype.itemsize * 3))).ravel()
    uniq, inv = np.unique(key, return_inverse=True)
    verts = uniq.view(np.float32).reshape(-1, 3)
    faces = inv.reshape(-1, 3).astype(np.int32)
    ok = (faces[:, 0] != faces[:, 1]) & (faces[:, 1] != faces[:, 2]) & (faces[:, 0] != faces[:, 2])
    return verts, faces[ok]


def area_of(co, tri):
    a, b, c = co[tri[:, 0]], co[tri[:, 1]], co[tri[:, 2]]
    return float(np.linalg.norm(np.cross(b - a, c - a), axis=1).sum() / 2)


def compact(co, tri, *extra):
    used = np.zeros(len(co), bool)
    used[tri.ravel()] = True
    remap = np.cumsum(used) - 1
    return (co[used], remap[tri].astype(np.int32), *[e[used] for e in extra])


def blender_mesh(name, verts, faces, target=None, subdivide=0):
    """Decimate (or subdivide) through Blender modifiers; returns verts, smooth normals, triangles."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [], faces.tolist())
    mesh.update()
    mesh.validate(verbose=False)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    count = len(mesh.polygons)
    if target and count > target:
        mod = obj.modifiers.new("decimate", "DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = target / count
        mod.use_collapse_triangulate = True
    if subdivide:
        mod = obj.modifiers.new("subsurf", "SUBSURF")
        mod.levels = subdivide
        mod.render_levels = subdivide
    graph = bpy.context.evaluated_depsgraph_get()
    graph.update()
    shown = obj.evaluated_get(graph)
    out = shown.to_mesh()
    out.calc_loop_triangles()
    nv = len(out.vertices)
    co = np.empty(nv * 3, np.float32)
    out.vertices.foreach_get("co", co)
    no = np.empty(nv * 3, np.float32)
    out.vertex_normals.foreach_get("vector", no)
    tri = np.empty(len(out.loop_triangles) * 3, np.int32)
    out.loop_triangles.foreach_get("vertices", tri)
    shown.to_mesh_clear()
    bpy.data.objects.remove(obj)
    bpy.data.meshes.remove(mesh)
    co, tri, no = compact(co.reshape(-1, 3), tri.reshape(-1, 3), no.reshape(-1, 3))
    return co, no, tri


def normals_of(co, tri):
    n = np.zeros_like(co, dtype=np.float64)
    fn = np.cross(co[tri[:, 1]] - co[tri[:, 0]], co[tri[:, 2]] - co[tri[:, 0]]).astype(np.float64)
    for k in range(3):
        np.add.at(n, tri[:, k], fn)
    return (n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)).astype(np.float32)


def components(nv, tri):
    parent = np.arange(nv)
    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    for a, b, c in tri.tolist():
        ra, rb, rc = find(a), find(b), find(c)
        if ra != rb: parent[rb] = ra
        if ra != rc: parent[find(rc)] = ra
    return np.array([find(i) for i in range(nv)], np.int64)


def keep_shell(co, no, tri, share):
    comp = components(len(co), tri)
    tri_comp = comp[tri[:, 0]]
    ids, counts = np.unique(tri_comp, return_counts=True)
    keep = set(ids[counts >= share * len(tri)].tolist())
    mask = np.array([c in keep for c in tri_comp.tolist()])
    c2, t2, n2 = compact(co, tri[mask], no)
    return c2, n2, t2


def struct(sid, layer, kind, pieces):
    """A structure is a list of pieces: (name, co, no, tri)."""
    co, no, tri, part, names, base = [], [], [], [], [], 0
    for index, (name, c, n, t) in enumerate(pieces):
        co.append(c.astype(np.float32)); no.append(n.astype(np.float32)); tri.append(t + base)
        part.append(np.full(len(c), min(index, 255), np.uint8))
        names.append(name)
        base += len(c)
    return dict(id=sid, layer=layer, kind=kind, co=np.concatenate(co), no=np.concatenate(no), tri=np.concatenate(tri), part=np.concatenate(part), names=names)


# ── 1. BodyParts3D structures ───────────────────────────────────────────────
def bp3_structure(s):
    cache = os.path.join(DEC, "%s-%d.npz" % (s["id"], s["tris"]))
    if os.path.exists(cache) and not FRESH:
        z = np.load(cache, allow_pickle=True)
        pieces = [(str(z["names"][i]), z["co%d" % i], z["no%d" % i], z["tri%d" % i]) for i in range(len(z["names"]))]
        return pieces
    loaded = []
    for f in s["files"]:
        verts, faces = weld(read_stl(os.path.join(STL, f["id"] + ".stl")))
        loaded.append((f["name"], verts, faces, area_of(verts, faces)))
    total = sum(a for _, _, _, a in loaded) or 1.0
    pieces = []
    for name, verts, faces, area in loaded:
        target = max(MIN_PART, int(round(s["tris"] * area / total)))
        c, n, t = blender_mesh(s["id"], verts, faces, target)
        if s["id"] == "piel":
            c, n, t = keep_shell(c, n, t, 0.02)
        pieces.append((name, c, n, t))
    save = {"names": np.array([p[0] for p in pieces])}
    for i, (_, c, n, t) in enumerate(pieces):
        save["co%d" % i], save["no%d" % i], save["tri%d" % i] = c, n, t
    np.savez(cache, **save)
    return pieces


male = {}
for s in parts:
    t = time.time()
    pieces = bp3_structure(s)
    male[s["id"]] = struct(s["id"], s["layer"], s.get("kind", ""), pieces)
    if time.time() - t > 2:
        log("%-18s %6d tris | %.1fs" % (s["id"], len(male[s["id"]]["tri"]), time.time() - t))
log("BodyParts3D:", len(male), "structures")
floor = float(male["piel"]["co"][:, 2].min())
for b in male.values():
    b["co"] = (b["co"] - np.array([0.0, AXIS_Y, floor], np.float32)).astype(np.float32)

# ── 2. Z-Anatomy structures, fitted onto the same frame ─────────────────────
al = json.load(open(os.path.join(ZA, "align.json")))
R, sc, tr = np.array(al["R"]), al["s"], np.array(al["t"])
za_index = json.load(open(os.path.join(ZA, "index.json"), encoding="utf8"))
EXCL = re.compile(r"^(Ascending aorta|Aortic arch|Thoracic aorta|Abdominal aorta|Descending aorta|Brachiocephalic trunk|(Left |Right )?common carotid artery|(Left |Right )?subclavian (artery|vein)|Coeliac trunk|Common hepatic artery|Splenic (artery|vein)|Left gastric artery|Superior mesenteric (artery|vein)|Inferior mesenteric artery|(Left |Right )?renal (artery|vein)|Common iliac (artery|vein)|External iliac (artery|vein)|Internal iliac (artery|vein)|Pulmonary trunk|Bifurcation of pulmonary trunk|(Left |Right )?pulmonary artery|.*segmental artery of (left|right) lung|.*lobar artery.*|.*lingular (artery|vein).*|.*vein of (left|right) lung|.*pulmonary vein|Superior vena cava|Inferior vena cava.*|(Left |Right )?brachiocephalic vein|Internal jugular vein|(Left |Right )?coronary artery|Anterior interventricular artery|Circumflex artery of heart|Great cardiac vein|Coronary sinus|Middle cardiac vein|.*vein of left ventricle.*|Small cardiac vein|Anterior cardiac veins|Posterior interventricular artery|Optic nerve.*|Central retinal artery|.*\?.*|Ciliary body-curve|Central canal.*)$", re.I)
ZGROUPS = [
    ("art-cerebrales", "vaso", "art", 26000, r"cerebral artery|cerebellar artery|communicating artery|Basilar artery|pontine branches|\(M2|central sulcus|precentral sulcus|Branch to angular gyrus|Callosomarginal|frontobasal|(Lateral|Medial) occipital artery|striate|choroidal artery|Vertebral artery|Internal carotid artery|Ophthalmic artery|Anterior spinal artery|Pericallosal|Insular branches|Frontal branches of callosomarginal|Anterior temporal branch|Temporal branches"),
    ("art-cabeza", "vaso", "art", 18000, r"External carotid|Facial artery|Lingual artery|Maxillary artery|Superficial temporal artery|Frontal branch of superficial|Parietal branch of superficial|Occipital artery|Posterior auricular artery|Ascending pharyngeal|meningeal|alveolar artery|Buccal artery|deep temporal artery|Infra-orbital artery|palatine artery|labial artery|Angular artery|Superior thyroid artery|Lacrimal artery|ethmoidal artery|Anterior septal branches|ciliary arteries|pterygoid canal|Sphenopalatine|Transverse facial artery|Mental artery|Submental artery|Masseteric artery|Supra-orbital artery|Supratrochlear artery|Dorsal nasal artery"),
    ("ven-cabeza", "vaso", "ven", 18000, r"jugular vein|Facial vein|Common facial vein|Retromandibular vein|retromandibular|sinus|Angular vein|ophthalmic vein|Maxillary veins|Lingual vein|labial vein|Superficial temporal vein|Emissary|cerebral vein|Basal vein|Pterygoid|Occipital vein|venous plexus|Basilar venous plexus|Great cerebral vein|Supra-orbital vein|Supratrochlear vein|Confluence"),
    ("art-brazo", "vaso", "art", 22000, r"Axillary artery|Brachial artery|Deep brachial artery|Radial artery|Ulnar artery|interosseous artery|palmar arch|palmar digital arter|Dorsal digital arteries of hand|metacarpal arter|carpal branch|Dorsal carpal|carpal anastomosis|ulnar collateral|radial collateral|Middle collateral|recurrent artery|circumflex humeral artery|Thoraco-acromial artery|Lateral thoracic artery|Subscapular artery|Circumflex scapular artery|Thoracodorsal artery|Superior thoracic artery|princeps pollicis|radialis indicis|Transverse cervical artery|transverse cervical artery|Suprascapular artery|Dorsal scapular artery|Ulnar recurrent"),
    ("ven-brazo", "vaso", "ven", 20000, r"Axillary vein|Brachial veins|Cephalic vein|Basilic vein|Median cubital|Median antebrachial|Dorsal venous network of hand|venous palmar arch|Dorsal digital veins of hand|Radial veins|Ulnar veins|circumflex humeral vein|Lateral thoracic vein|Circumflex scapular vein|Thoracodorsal vein|Subscapular vein|metacarpal vein|Thoraco-acromial vein|Transverse cervical vein|Suprascapular vein|Intercapitular veins of hand"),
    ("art-pierna", "vaso", "art", 24000, r"Femoral artery|Deep femoral artery|circumflex femoral artery|Popliteal artery|genicular artery|tibial artery|Fibular artery|Dorsalis pedis|plantar artery|Arcuate artery|metatarsal arter|digital arteries of foot|plantar digital arter|Deep plantar artery|tarsal artery|Calcaneal branches|gluteal artery|Obturator artery|external pudendal artery|Descending genicular|Perforating arter|Sural arter|malleolar|Descending branch of lateral circumflex|Plantar arch"),
    ("ven-pierna", "vaso", "ven", 22000, r"Femoral vein|Deep femoral vein|circumflex femoral vein|Popliteal vein|Genicular veins|tibial veins|Fibular veins|saphenous vein|Dorsal venous arch of foot|metatarsal vein|digital veins of foot|plantar veins?|Intercapitular veins of foot|gluteal veins?|External pudendal veins|Obturator vein|Perforating veins|Sural veins|venous arch"),
    ("art-tronco", "vaso", "art", 16000, r"Internal thoracic artery|intercostal arter|Costocervical|Thyrocervical|Inferior thyroid artery|Deep cervical artery|Supreme intercostal|epigastric artery|Musculophrenic|phrenic artery|Lumbar arteries|Iliolumbar artery|Iliacus branch|Lumbar branch of iliolumbar|sacral arter|Subcostal artery|Ascending cervical|Pericardiacophrenic|Bronchial|Oesophageal"),
    ("ven-tronco", "vaso", "ven", 16000, r"zygos|intercostal vein|Internal thoracic veins?|epigastric veins?|Lumbar veins|ascending lumbar vein|Subcostal vein|Iliolumbar vein|sacral veins?|Thyroid veins|thyroid vein|Vertebral vein|Brachiocephalic|Pericardiacophrenic vein"),
    ("art-visceral", "vaso", "art", 16000, r"Gastroduodenal|hepatic artery|Proper hepatic|Cystic artery|gastric artery|gastro-omental artery|pancreaticoduodenal artery|Short gastric|Jejunal arter|Ileal arter|Ileocolic artery|colic artery|Sigmoid arter|rectal artery|Appendicular artery|Marginal artery|suprarenal arter|Intrarenal arteries|branch of renal artery|Colic branch|Ileal branch|vesical artery|Internal pudendal artery|Anterior division of internal iliac|Posterior division of internal iliac|Umbilical artery|Middle sacral|Pancreatic|Dorsal pancreatic|Great pancreatic|Testicular artery|testicular artery|of penis|Artery of bulb|prostatic"),
    ("ven-visceral", "vaso", "ven", 16000, r"Hepatic portal vein|Inferior mesenteric vein|gastric vein|gastro-omental vein|Hepatic veins|Intrarenal veins|rectal vein|colic vein|Pancreatic veins?|Paraumbilical|Cystic vein|vesical vein|Internal pudendal vein|Jejunal veins|Ileal veins|Sigmoid veins|Ileocolic vein|Pancreaticoduodenal vein|suprarenal vein|testicular vein|Testicular vein|of penis|Prostatic"),
    ("n-craneales", "nervio", "nerve", 16000, r"Olfactory nerve|Oculomotor nerve|Trochlear nerve|Trigeminal nerve|root of trigeminal|Ophthalmic nerve|Maxillary nerve|andibular nerve|Lingual nerve|Inferior alveolar nerve|Buccal nerve|Mental nerve|Abducens nerve|Vestibulocochlear|Cochlear nerve|Vestibular nerve|Glossopharyngeal|Accessory nerve|Hypoglossal|Chorda tympani|Nerve to mylohyoid|Meningeal branch|Auriculotemporal|division of mandibular"),
    ("n-facial", "nervio", "nerve", 5000, r"Facial nerve"),
    ("n-vago", "nervio", "nerve", 9000, r"Vagus nerve|recurrent laryngeal|Superior laryngeal"),
    ("plexo-braquial", "nervio", "nerve", 12000, r"brachial plexus|Dorsal scapular nerve|Long thoracic nerve|Suprascapular nerve|Subclavian nerve|pectoral nerve|subscapular nerve|Thoracodorsal nerve|Medial brachial cutaneous|antebrachial cutaneous nerve|Anterior branch of medial antebrachial|Posterior branch of medial antebrachial|Intercostobrachial"),
    ("n-axilar", "nervio", "nerve", 2500, r"Axillary nerve|branches of axillary|Superior lateral brachial cutaneous"),
    ("n-musculocutaneo", "nervio", "nerve", 2500, r"Musculocutaneous"),
    ("n-radial", "nervio", "nerve", 6000, r"Radial nerve|branch of radial nerve|branches of radial nerve|Posterior interosseous nerve|Posterior antebrachial cutaneous|Inferior lateral brachial cutaneous|Dorsal digital branches of radial"),
    ("n-mediano", "nervio", "nerve", 6000, r"Median nerve|of median nerve|Anterior interosseous nerve|Communicating branch of median"),
    ("n-cubital", "nervio", "nerve", 6000, r"Ulnar nerve|of ulnar nerve"),
    ("n-intercostales", "nervio", "nerve", 12000, r"Intercostal nerves|Thoracic nerves|Subcostal nerve"),
    ("plexo-lumbar", "nervio", "nerve", 8000, r"Iliohypogastric|Ilio-inguinal|enitofemoral|Lateral femoral cutaneous|Obturator nerve|branch of obturator nerve|ami of lumbar nerves|Lumbar nerves|Lumbar plexus"),
    ("n-femoral", "nervio", "nerve", 6000, r"Femoral nerve|of femoral nerve|aphenous nerve"),
    ("n-ciatico", "nervio", "nerve", 14000, r"Sciatic nerve|Tibial nerve|Common fibular nerve|Deep fibular nerve|Superficial fibular nerve|fibular nerve|Sural|plantar nerve|plantar digital branches|cutaneous nerve of foot|Medial sural|Medial crural"),
    ("n-pelvicos", "nervio", "nerve", 5000, r"Pudendal nerve|gluteal nerve|Posterior femoral cutaneous|Nerve to piriformis|Nerve to quadratus|Sacral nerves|Coccygeal|Pelvic splanchnic"),
    ("n-autonomo", "nervio", "nerve", 8000, r"Sympathetic|splanchnic"),
    ("raices", "nervio", "nerve", 8000, r"Cauda equina|root of spinal nerve|Anterior root|Posterior root|Spinal nerves|Roots of nerves"),
    ("ganglios", "vaso", "lymph", 22000, r"nodes?\b|node\)"),
    ("tiroides", "organo", "", 6000, r"^Thyroid gland$|parathyroid gland"),
    ("salivales", "organo", "", 6000, r"Parotid gland|parotid gland|Submandibular gland|Sublingual gland"),
    ("lengua-faringe", "organo", "", 12000, r"^Tongue$|^Epiglottis$|^Soft palate$|^Uvula of palate$|pharynx$"),
]
MALE_ONLY = re.compile(r"penis|testicular|Testicular|prostatic|Prostatic|bulb", re.I)
zgroups = {g[0]: [] for g in ZGROUPS}
unmatched = []
for e in za_index:
    if e["collection"] == "bones":
        continue
    base = re.sub(r"\.[lr]$", "", e["name"])
    if EXCL.match(base) or base.endswith(".j"):
        continue
    hit = None
    for gid, layer, kind, budget, rx in ZGROUPS:
        if re.search(rx, base):
            hit = gid
            break
    if hit:
        zgroups[hit].append(e)
    elif e["collection"] in ("5: Cardiovascular system", "7: Nervous system & Sense organs") and e["type"] == "CURVE":
        unmatched.append(base)
log("Z-Anatomy unmatched:", len(set(unmatched)), "; ".join(sorted(set(unmatched))[:60]))


def za_points(e):
    z = np.load(os.path.join(ZA, "obj", e["file"]))
    co = (sc * (z["co"].astype(np.float64) @ R.T) + tr - np.array([0.0, AXIS_Y, floor])).astype(np.float32)
    return co, z["tri"].astype(np.int32)


def za_structure(gid, layer, kind, budget, members):
    cache = os.path.join(DEC, "za-%s-%d.npz" % (gid, budget))
    if os.path.exists(cache) and not FRESH:
        z = np.load(cache, allow_pickle=True)
        return [(str(z["names"][i]), z["co%d" % i], z["no%d" % i], z["tri%d" % i]) for i in range(len(z["names"]))]
    loaded = []
    for e in members:
        co, tri = za_points(e)
        loaded.append((e["name"], co, tri, max(area_of(co, tri), 1.0)))
    total = sum(a for *_, a in loaded) or 1.0
    pieces = []
    for name, co, tri, area in loaded:
        target = max(MIN_PART, int(round(budget * area / total)))
        sub = 1 if gid in ("tiroides",) else 0
        c, n, t = blender_mesh(gid, co, tri, target if not sub else None, subdivide=sub)
        if len(t):
            pieces.append((name, c, n, t))
    save = {"names": np.array([p[0] for p in pieces])}
    for i, (_, c, n, t) in enumerate(pieces):
        save["co%d" % i], save["no%d" % i], save["tri%d" % i] = c, n, t
    np.savez(cache, **save)
    return pieces


for gid, layer, kind, budget, rx in ZGROUPS:
    members = zgroups[gid]
    if not members:
        log("empty Z group", gid)
        continue
    t = time.time()
    pieces = za_structure(gid, layer, kind, budget, members)
    male[gid] = struct(gid, layer, kind, pieces)
    log("%-18s %3d piezas %6d tris | %.1fs" % (gid, len(pieces), len(male[gid]["tri"]), time.time() - t))

# ── 3. the female body ──────────────────────────────────────────────────────
def spline(points):
    xs = np.array([p[0] for p in points], np.float64)
    ys = np.array([p[1] for p in points], np.float64)
    return lambda z: np.interp(z, xs, ys)


# Width (x) of the body as a function of height, female/male, applied around the midline.
FX = spline([(0, 1.0), (380, 1.0), (560, 1.03), (700, 1.06), (790, 1.08), (860, 1.09), (930, 1.05), (1000, 0.95), (1050, 0.92), (1110, 0.95), (1200, 0.97), (1290, 0.96), (1350, 0.92), (1420, 0.93), (1480, 0.96), (1700, 0.96)])
# Depth (y) at the back: fuller hips, the same elsewhere.
FYB = spline([(0, 1.0), (700, 1.02), (800, 1.08), (880, 1.06), (960, 1.0), (1700, 1.0)])
FYF = spline([(0, 1.0), (1000, 0.96), (1080, 0.95), (1150, 1.0), (1700, 1.0)])
TORSO = spline([(0, 120), (700, 175), (850, 195), (950, 168), (1050, 150), (1150, 162), (1300, 178), (1380, 150), (1700, 120)])


def warp(co):
    """The male body's points mapped to the female body."""
    p = co.astype(np.float64).copy()
    z = p[:, 2]
    # Arms keep their own shape and move in with the narrower shoulders.
    arm = np.clip((np.abs(p[:, 0]) - TORSO(z) - 8) / 30.0, 0, 1) * (z > 700) * (z < 1480)
    shoulder_shift = 175 * (1 - 0.92)
    fx = FX(z)
    x = p[:, 0] * ((1 - arm) * fx + arm) - arm * np.sign(p[:, 0]) * shoulder_shift
    fy = np.where(p[:, 1] > 0, FYB(z), FYF(z))
    y = p[:, 1] * ((1 - arm) * fy + arm)
    p[:, 0], p[:, 1] = x, y
    # The head a little smaller about its centre.
    head = np.clip((z - 1440) / 60.0, 0, 1)
    hc = np.array([0.0, 10.0, 1570.0])
    p = p + (hc + (p - hc) * 0.96 - p) * head[:, None]
    # Overall: 94 % of the height, 95 % of the girth.
    p *= np.array([0.95, 0.95, 0.94])
    return p.astype(np.float32)


def ray_front(tree, x, z):
    """The front-most point of a surface on the line (x, *, z)."""
    hit = tree.ray_cast((x, -900.0, z), (0.0, 1.0, 0.0), 2000.0)
    return np.array(hit[0]) if hit[0] is not None else None


def build_female(male):
    fem = {}
    for sid, b in male.items():
        if sid in ("genitales", "prostata"):
            continue
        keep = np.ones(len(b["names"]), bool)
        if b["kind"] in ("art", "ven"):
            keep = np.array([not MALE_ONLY.search(n) for n in b["names"]])
        co = warp(b["co"])
        d = dict(b, co=co)
        if not keep.all():
            mask_v = keep[b["part"]]
            tri_mask = mask_v[b["tri"][:, 0]]
            co2, tri2, part2 = compact(co, b["tri"][tri_mask], b["part"])
            d.update(co=co2, tri=tri2, part=part2)
        d["no"] = normals_of(d["co"], d["tri"])
        fem[sid] = d
    log("female: warped", len(fem), "structures")

    # Skin: take away the male external genitalia and close the gap smoothly.
    skin = fem["piel"]
    g = male["genitales"]["co"]
    glo, ghi = warp(g).min(axis=0) - np.array([6, 10, 8]), warp(g).max(axis=0) + np.array([6, 4, 6])
    co, tri = skin["co"], skin["tri"]
    cen = co[tri].mean(axis=1)
    inside = np.all((cen > glo) & (cen < ghi), axis=1) & (cen[:, 1] < glo[1] + (ghi[1] - glo[1]) * 0.9)
    log("female: skin faces removed", int(inside.sum()))
    import bmesh
    me = bpy.data.meshes.new("skin")
    me.from_pydata(co.tolist(), [], tri[~inside].tolist())
    me.update()
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.01)
    boundary = [e for e in bm.edges if e.is_boundary and all(glo[i] - 25 < (e.verts[0].co[i] + e.verts[1].co[i]) / 2 < ghi[i] + 25 for i in range(3))]
    filled = bmesh.ops.holes_fill(bm, edges=boundary, sides=0)
    new_faces = filled["faces"]
    bmesh.ops.triangulate(bm, faces=new_faces)
    region = [f for f in bm.faces if all(glo[i] - 30 < f.calc_center_median()[i] < ghi[i] + 30 for i in range(3))]
    bmesh.ops.subdivide_edges(bm, edges=list({e for f in region for e in f.edges}), cuts=2, use_grid_fill=True)
    inner = [v for v in bm.verts if all(glo[i] - 2 < v.co[i] < ghi[i] + 2 for i in range(3))]
    for _ in range(60):
        moved = []
        for v in inner:
            if v.is_boundary:
                continue
            nb = [e.other_vert(v).co for e in v.link_edges]
            if nb:
                moved.append((v, sum(nb, v.co * 0) / len(nb)))
        for v, p in moved:
            v.co = v.co * 0.4 + p * 0.6
    # A soft mons and the labia, tucked between the thighs.
    cx, cy, cz = 0.0, (glo[1] + ghi[1]) / 2, (glo[2] + ghi[2]) / 2
    for v in inner:
        dx, dz = v.co.x / 22.0, (v.co.z - (cz - 10)) / 34.0
        r2 = dx * dx + dz * dz
        if r2 < 1.0:
            v.co.y -= 5.0 * (1 - r2) ** 2
            v.co.y += 3.0 * math.exp(-(v.co.x / 3.0) ** 2) * (1 - r2)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    co2 = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get("co", co2)
    me.calc_loop_triangles()
    t2 = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", t2)
    bpy.data.meshes.remove(me)
    co2, t2 = co2.reshape(-1, 3), t2.reshape(-1, 3)

    # Breasts: a dome on each side of the chest, fuller below, with a small nipple.
    tree = BVHTree.FromPolygons(co2.tolist(), t2.tolist(), all_triangles=True)
    stern = fem["esternon"]["co"]
    zb = float(np.percentile(stern[:, 2], 40)) - 18
    nipples = []
    no2 = normals_of(co2, t2)
    for side in (-1, 1):
        base = ray_front(tree, side * 92.0, zb)
        nipples.append(base)
        d = co2 - base
        r = np.sqrt((d[:, 0] / 1.0) ** 2 + ((d[:, 2] + 12) / 1.05) ** 2 + (d[:, 1] * 0.6) ** 2)
        R0 = 92.0
        w = np.clip(1 - (r / R0) ** 2, 0, 1) ** 2 * (d[:, 1] < 40) * (co2[:, 1] < 20)
        lower = 1 + 0.35 * np.clip(-(d[:, 2] + 6) / 50.0, 0, 1)
        dirv = no2 * 0.65 + np.array([side * 0.12, -0.75, -0.18])
        dirv /= np.linalg.norm(dirv, axis=1, keepdims=True)
        amp = 52.0 * w * lower
        nip = np.exp(-((d[:, 0] ** 2 + d[:, 2] ** 2) / (2 * 6.5 ** 2))) * (np.abs(d[:, 1]) < 30)
        areola = np.exp(-((d[:, 0] ** 2 + d[:, 2] ** 2) / (2 * 16.0 ** 2))) * (np.abs(d[:, 1]) < 30)
        co2 = co2 + dirv * (amp + 5.5 * nip + 1.2 * areola)[:, None]
    fem["piel"] = dict(skin, co=co2.astype(np.float32), tri=t2, no=normals_of(co2, t2), part=np.zeros(len(co2), np.uint8), names=["skin"])

    # The bladder sits flatter and further forward, leaving room for the uterus and the vagina.
    bl, ur = female.reshape_bladder(fem["vejiga"]["co"], fem["ureteres"]["co"])
    fem["vejiga"].update(co=bl, no=normals_of(bl, fem["vejiga"]["tri"]))
    fem["ureteres"].update(co=ur, no=normals_of(ur, fem["ureteres"]["tri"]))
    # Pelvic organs and their vessels (tools/female.py), placed from this pelvis.
    get = lambda sid: fem[sid]
    L = female.landmarks(get)
    intro = female.introitus_from(fem["piel"]["co"], L["sym_bottom"])
    organs, L, corner, ovary = female.pelvic_organs(get, intro)
    female.gonadal_vessels(get, ovary, organs)
    # Mammary glands, resting on pectoralis major behind each nipple.
    rng = np.random.default_rng(5)
    organs["mamas"] = []
    for s, nip in female.nipples_from(fem["piel"]["co"]).items():
        inward = [-s * 0.2, 1.0, 0.12]
        female.mammary(nip, inward, rng, organs["mamas"], female.chest_depth(nip, inward, fem["m-pectorales"]["co"]))
    kinds = {"utero": ("organo", ""), "vagina": ("organo", ""), "ovarios": ("organo", ""), "trompas": ("organo", ""),
             "vasos-gonadales": ("vaso", "art"), "ven-gonadales": ("vaso", "ven"), "mamas": ("organo", "")}
    for sid, (layer, kind) in kinds.items():
        fem[sid] = struct(sid, layer, kind, organs[sid])
    log("female: organs modelled")
    return fem


# ── 4. bakes ────────────────────────────────────────────────────────────────
def tree_of(bodies, ids):
    verts, polys, base = [], [], 0
    for sid in ids:
        b = bodies[sid]
        verts.append(b["co"]); polys.append(b["tri"] + base); base += len(b["co"])
    return BVHTree.FromPolygons(np.concatenate(verts).tolist(), np.concatenate(polys).tolist(), all_triangles=True)


rng = np.random.default_rng(7)
side = int(math.ceil(math.sqrt(AO_RAYS)))
samples = []
for i in range(side):
    for j in range(side):
        u, v = (i + 0.5) / side, (j + 0.5) / side
        samples.append((math.sqrt(u) * math.cos(2 * math.pi * v), math.sqrt(u) * math.sin(2 * math.pi * v), math.sqrt(max(0.0, 1 - u))))
samples = np.array(samples[:AO_RAYS], np.float32)


def bake_ao(b, tree):
    co, no = b["co"], b["no"]
    n = no / np.maximum(np.linalg.norm(no, axis=1, keepdims=True), 1e-6)
    helper = np.where(np.abs(n[:, [2]]) < 0.9, np.array([[0, 0, 1.0]], np.float32), np.array([[1.0, 0, 0]], np.float32))
    t1 = np.cross(helper, n); t1 /= np.maximum(np.linalg.norm(t1, axis=1, keepdims=True), 1e-6)
    t2 = np.cross(n, t1)
    spin = rng.random(len(co)) * 2 * math.pi
    cs, sn = np.cos(spin)[:, None], np.sin(spin)[:, None]
    a1, a2 = t1 * cs + t2 * sn, t2 * cs - t1 * sn
    origins = (co + n * 0.5).tolist()
    out = np.empty(len(co), np.float32)
    cast = tree.ray_cast
    for i in range(len(co)):
        dirs = (samples[:, [0]] * a1[i] + samples[:, [1]] * a2[i] + samples[:, [2]] * n[i]).tolist()
        o = origins[i]
        occ = 0.0
        for d in dirs:
            hit = cast(o, d, AO_REACH)
            if hit[0] is not None:
                near = 1.0 - hit[3] / AO_REACH
                occ += near * near
        out[i] = 1.0 - occ / AO_RAYS
    acc, cnt = out.copy(), np.ones(len(co), np.float32)
    for a, c in ((0, 1), (1, 2), (2, 0)):
        np.add.at(acc, b["tri"][:, a], out[b["tri"][:, c]]); np.add.at(cnt, b["tri"][:, a], 1)
        np.add.at(acc, b["tri"][:, c], out[b["tri"][:, a]]); np.add.at(cnt, b["tri"][:, c], 1)
    return acc / cnt


def bake_thickness(b):
    """Distance through the part along the inward normal (mm, up to 255)."""
    tree = BVHTree.FromPolygons(b["co"].tolist(), b["tri"].tolist(), all_triangles=True)
    n = b["no"] / np.maximum(np.linalg.norm(b["no"], axis=1, keepdims=True), 1e-6)
    out = np.empty(len(b["co"]), np.float32)
    starts = (b["co"] - n * 0.3).tolist()
    dirs = (-n).tolist()
    cast = tree.ray_cast
    for i in range(len(out)):
        hit = cast(starts[i], dirs[i], 255.0)
        out[i] = hit[3] if hit[0] is not None else 255.0
    return out


def bake_axes(b):
    """Per part: long axis (muscle fibres) and the position of each vertex along it (0..1)."""
    fib = np.zeros_like(b["co"])
    axial = np.zeros(len(b["co"]), np.float32)
    for p in np.unique(b["part"]):
        m = b["part"] == p
        pts = b["co"][m].astype(np.float64)
        if len(pts) < 4:
            continue
        c = pts.mean(axis=0)
        u = np.linalg.svd(pts - c, full_matrices=False)[2][0]
        if u[2] < 0: u = -u
        t = (pts - c) @ u
        lo, hi = np.percentile(t, 1), np.percentile(t, 99)
        fib[m] = u
        axial[m] = np.clip((t - lo) / max(hi - lo, 1e-6), 0, 1)
    return fib, axial


def graph_of(co, tri):
    adj = [[] for _ in range(len(co))]
    e = np.concatenate([tri[:, [0, 1]], tri[:, [1, 2]], tri[:, [2, 0]]])
    e = np.unique(np.sort(e, axis=1), axis=0)
    length = np.linalg.norm(co[e[:, 0]] - co[e[:, 1]], axis=1)
    for (a, c), l in zip(e.tolist(), length.tolist()):
        adj[a].append((c, l)); adj[c].append((a, l))
    return adj


def geodesic(co, tri, seeds):
    n = len(co)
    adj = graph_of(co, tri)
    dist = [math.inf] * n
    heap = []
    for v, d in seeds.items():
        dist[v] = d; heap.append((d, v))
    heapq.heapify(heap)
    points = co.tolist()
    while True:
        while heap:
            d, v = heapq.heappop(heap)
            if d > dist[v]:
                continue
            for w, l in adj[v]:
                nd = d + l
                if nd < dist[w]:
                    dist[w] = nd; heapq.heappush(heap, (nd, w))
        lost = [i for i in range(n) if dist[i] == math.inf]
        if not lost:
            break
        found = [i for i in range(n) if dist[i] != math.inf]
        kd = KDTree(len(found))
        for slot, i in enumerate(found):
            kd.insert(points[i], slot)
        kd.balance()
        best = (math.inf, -1, -1)
        for i in lost:
            _, slot, gap = kd.find(points[i])
            if gap < best[0]:
                best = (gap, i, found[slot])
        gap, i, j = best
        dist[i] = dist[j] + gap
        heap = [(dist[i], i)]
    return np.array(dist, np.float32)


def nearest(co, point, lo=0, hi=None):
    hi = len(co) if hi is None else hi
    return lo + int(np.argmin(np.linalg.norm(co[lo:hi] - np.asarray(point, np.float32), axis=1)))


def bake_flow(bodies):
    for b in bodies.values():
        b["flow"] = np.zeros(len(b["co"]), np.float32)
    def merged(ids):
        co, tri, spans, base = [], [], {}, 0
        for sid in ids:
            if sid not in bodies: continue
            b = bodies[sid]
            co.append(b["co"]); tri.append(b["tri"] + base); spans[sid] = (base, base + len(b["co"])); base += len(b["co"])
        return np.concatenate(co), np.concatenate(tri), spans
    def tree(ids, seed_of):
        ids = [i for i in ids if i in bodies]
        co, tri, spans = merged(ids)
        d = geodesic(co, tri, seed_of(co, spans))
        for sid, (lo, hi) in spans.items():
            bodies[sid]["flow"] = d[lo:hi]
    def part_span(sid, name):
        b = bodies[sid]
        index = b["names"].index(name)
        where = np.nonzero(b["part"] == index)[0]
        return int(where[0]), int(where[-1]) + 1
    heart = bodies["corazon"]["co"].mean(axis=0)
    liver = bodies["higado"]["co"].mean(axis=0)
    def aortic_root(co, spans):
        lo, hi = part_span("aorta", "ascending aorta")
        lo, hi = lo + spans["aorta"][0], hi + spans["aorta"][0]
        return {lo + int(np.argmin(co[lo:hi, 2])): 0.0}
    tree(["aorta", "carotidas", "subclavias", "tronco-celiaco", "mesentericas", "art-renales", "art-iliacas", "cor-izq", "cor-da", "cor-cx", "cor-der"], aortic_root)
    tree(["art-pulmonar"], lambda co, spans: {nearest(co, heart): 0.0})
    tree(["vcs", "yugulares"], lambda co, spans: {nearest(co, heart, *spans["vcs"]): 0.0})
    tree(["vci", "ven-renales", "ven-iliacas"], lambda co, spans: {nearest(co, heart, *spans["vci"]): 0.0})
    tree(["venas-cardiacas"], lambda co, spans: {nearest(co, heart + np.array([-20.0, 25.0, 0.0], np.float32)): 0.0})
    tree(["porta"], lambda co, spans: {nearest(co, liver): 0.0})
    def each_piece(sid, pick):
        b = bodies[sid]
        comp = components(len(b["co"]), b["tri"])
        seeds = {}
        for c in np.unique(comp):
            where = np.nonzero(comp == c)[0]
            seeds[int(where[pick(b["co"][where])])] = 0.0
        return seeds
    bodies["ven-pulmonares"]["flow"] = geodesic(bodies["ven-pulmonares"]["co"], bodies["ven-pulmonares"]["tri"], each_piece("ven-pulmonares", lambda c: int(np.argmin(np.linalg.norm(c - heart, axis=1)))))
    tree(["traquea", "bronquios"], lambda co, spans: {spans["traquea"][0] + int(np.argmax(co[spans["traquea"][0]:spans["traquea"][1], 2])): 0.0})
    bodies["ureteres"]["flow"] = geodesic(bodies["ureteres"]["co"], bodies["ureteres"]["tri"], each_piece("ureteres", lambda c: int(np.argmax(c[:, 2]))))
    # The gut, in order.
    prev = None
    for sid in ["esofago", "estomago", "duodeno", "yeyuno", "ileon", "colon", "recto"]:
        b = bodies[sid]
        if prev is None:
            seeds = {int(np.argmax(b["co"][:, 2])): 0.0}
        else:
            p = bodies[prev]
            kd = KDTree(len(p["co"]))
            for i, point in enumerate(p["co"].tolist()):
                kd.insert(point, i)
            kd.balance()
            best = (math.inf, 0, 0)
            for i, point in enumerate(b["co"].tolist()):
                _, j, gap = kd.find(point)
                if gap < best[0]:
                    best = (gap, i, j)
            seeds = {best[1]: float(p["flow"][best[2]]) + best[0]}
            if sid == "colon":
                right = np.nonzero(b["co"][:, 0] < -45)[0]
                seeds = {int(right[np.argmin(b["co"][right, 2])]): float(p["flow"].max())}
        b["flow"] = geodesic(b["co"], b["tri"], seeds)
        prev = sid
    colon, app = bodies["colon"], bodies["apendice"]
    j = nearest(colon["co"], app["co"].mean(axis=0))
    app["flow"] = geodesic(app["co"], app["tri"], {nearest(app["co"], colon["co"][j]): float(colon["flow"][j])})
    # Z-Anatomy vessels and nerves: each piece flows from its end nearest the heart (or the cord),
    # starting at that end's straight-line distance, so pulses and impulses run on continuously.
    spine = np.array([0.0, 40.0, 1150.0])
    for sid, b in bodies.items():
        if b["kind"] not in ("art", "ven", "nerve") or sid in ("aorta", "carotidas", "subclavias", "tronco-celiaco", "mesentericas", "art-renales", "art-iliacas", "cor-izq", "cor-da", "cor-cx", "cor-der", "art-pulmonar", "vcs", "yugulares", "vci", "ven-renales", "ven-iliacas", "venas-cardiacas", "porta", "ven-pulmonares"):
            continue
        origin = spine if b["kind"] == "nerve" else heart
        if sid in ("art-cerebrales", "art-cabeza", "ven-cabeza", "n-craneales", "n-facial"):
            origin = np.array([0.0, 30.0, 1480.0]) if b["kind"] == "nerve" else heart
        flow = np.zeros(len(b["co"]), np.float32)
        for p in np.unique(b["part"]):
            m = np.nonzero(b["part"] == p)[0]
            if len(m) < 3: continue
            local = {int(v): k for k, v in enumerate(m)}
            sub_tri = b["tri"][np.isin(b["tri"][:, 0], m)]
            if not len(sub_tri): continue
            sub_tri = np.vectorize(local.get)(sub_tri).astype(np.int32)
            pts = b["co"][m]
            s = int(np.argmin(np.linalg.norm(pts - origin, axis=1)))
            flow[m] = geodesic(pts, sub_tri, {s: float(np.linalg.norm(pts[s] - origin))})
        b["flow"] = flow


# ── 5. write ────────────────────────────────────────────────────────────────
def octa(n):
    n = n / np.maximum(np.abs(n).sum(axis=1, keepdims=True), 1e-9)
    xy = n[:, :2].copy()
    neg = n[:, 2] < 0
    sign = np.where(xy >= 0, 1.0, -1.0)
    xy[neg] = ((1 - np.abs(xy[neg][:, ::-1])) * sign[neg])
    return np.clip(np.round(xy * 127), -127, 127).astype(np.int8)


ORDER = [p["id"] for p in parts] + [g[0] for g in ZGROUPS] + ["utero", "vagina", "ovarios", "trompas", "vasos-gonadales", "ven-gonadales", "mamas"]


def write(name, bodies):
    t = time.time()
    groups = {}
    for sid, b in bodies.items():
        if sid == "piel": continue
        key = "blando" if b["layer"] in ("organo", "vaso") else b["layer"]
        groups.setdefault(key, []).append(sid)
    for key, ids in groups.items():
        tr_ = tree_of(bodies, ids)
        for sid in ids:
            bodies[sid]["ao"] = bake_ao(bodies[sid], tr_)
        log(name, "occlusion:", key, len(ids))
    bodies["piel"]["ao"] = np.ones(len(bodies["piel"]["co"]), np.float32)
    for b in bodies.values():
        b["thick"] = bake_thickness(b)
        b["fib"], b["axial"] = bake_axes(b)
    log(name, "thickness and axes")
    bake_flow(bodies)
    log(name, "flow | %.0fs" % (time.time() - t))
    every = np.concatenate([b["co"] for b in bodies.values()])
    lo = every.min(axis=0) - 1.0
    size = every.max(axis=0) + 1.0 - lo
    vertex = np.dtype([("p", "<u2", 3), ("flow", "<u2"), ("n", "i1", 2), ("ao", "u1"), ("part", "u1"), ("f", "i1", 2), ("thick", "u1"), ("axial", "u1")])
    os.makedirs(os.path.join(OUT, name), exist_ok=True)
    meta, blobs, offset = [], [], 0
    for sid in [s for s in ORDER if s in bodies]:
        b = bodies[sid]
        rec = np.zeros(len(b["co"]), vertex)
        rec["p"] = np.clip(np.round((b["co"] - lo) / size * 65535), 0, 65535).astype(np.uint16)
        rec["flow"] = np.clip(np.round(b["flow"] * 8), 0, 65535).astype(np.uint16)
        rec["n"] = octa(b["no"].astype(np.float64))
        rec["ao"] = np.clip(np.round(b["ao"] * 255), 0, 255).astype(np.uint8)
        rec["part"] = b["part"]
        rec["f"] = octa(b["fib"].astype(np.float64) + 1e-9)
        rec["thick"] = np.clip(np.round(b["thick"]), 0, 255).astype(np.uint8)
        rec["axial"] = np.clip(np.round(b["axial"] * 255), 0, 255).astype(np.uint8)
        vb, ib = rec.tobytes(), b["tri"].astype("<u4").tobytes()
        names = []
        for index, pname in enumerate(b["names"]):
            mask = b["part"] == index
            if not mask.any():
                names.append({"n": pname, "c": [0, 0, 0], "lo": [0, 0, 0], "hi": [0, 0, 0], "flow": [0, 0]}); continue
            where, along = b["co"][mask], b["flow"][mask]
            names.append({"n": pname, "c": [round(float(x), 1) for x in where.mean(axis=0)], "lo": [round(float(x), 1) for x in where.min(axis=0)], "hi": [round(float(x), 1) for x in where.max(axis=0)], "flow": [round(float(along.min()), 1), round(float(along.max()), 1)]})
        meta.append({"id": sid, "layer": b["layer"], "kind": b["kind"], "v": [offset, len(vb), len(rec)], "i": [offset + len(vb), len(ib), int(b["tri"].size)],
                     "lo": [round(float(x), 1) for x in b["co"].min(axis=0)], "hi": [round(float(x), 1) for x in b["co"].max(axis=0)], "c": [round(float(x), 1) for x in b["co"].mean(axis=0)],
                     "flow": [round(float(b["flow"].min()), 1), round(float(b["flow"].max()), 1)], "parts": names})
        blobs += [vb, ib]
        offset += len(vb) + len(ib)
    open(os.path.join(OUT, name, "raw.bin"), "wb").write(b"".join(blobs))
    heart = heart_axis(bodies["corazon"]["co"].astype(np.float64))
    info = {"model": name, "lo": [round(float(x), 2) for x in lo], "size": [round(float(x), 2) for x in size], "vertices": int(sum(m["v"][2] for m in meta)), "indices": int(sum(m["i"][2] for m in meta)),
            "heart": heart, "structs": meta}
    json.dump(info, open(os.path.join(OUT, name, "meta.json"), "w", encoding="utf8"), separators=(",", ":"))
    log("wrote", name, "| %d structures | %d vertices | %d triangles | %.1f MB raw" % (len(meta), info["vertices"], info["indices"] // 3, offset / 1e6))


if ONLY in ("", "mujer"):
    female = build_female(male)
if ONLY in ("", "hombre"):
    write("hombre", male)
if ONLY in ("", "mujer"):
    write("mujer", female)
log("done")
