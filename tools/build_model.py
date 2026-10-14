# Builds docs/body.bin.gz and src/body.json from the BodyParts3D meshes.
#
#   blender --background --factory-startup --python tools/build_model.py -- [--ao 20] [--fresh]
#
# For each structure in .cache/bp3d/parts.json: read its STL files, weld them, decimate each
# part with Blender's Decimate modifier to its share of the triangle budget, and keep smooth
# vertex normals. Then bake, per vertex, short-range ambient occlusion (ray casts against
# every structure but the skin) and a flow coordinate: millimetres along the vessel, airway
# or gut from where its contents enter. The page's shaders animate with both.
#
# Vertex (12 bytes): u16 x y z (normalised over the model bounds) · u16 flow (1/8 mm)
#                    · i8 normal (octahedral) × 2 · u8 occlusion · u8 part index.
import bpy, sys, os, json, math, time, heapq, gzip
import numpy as np
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache", "bp3d")
STL = os.path.join(CACHE, "stl")
DEC = os.path.join(CACHE, "dec")
os.makedirs(DEC, exist_ok=True)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = lambda name, default: (argv[argv.index(name) + 1] if name in argv else default)
AO_RAYS = int(opt("--ao", 20))
FRESH = "--fresh" in argv
AO_REACH = 30.0  # mm
MIN_PART = 36  # triangles a part keeps at least
AXIS_Y = -105.0  # the turntable's axis passes through the trunk
T0 = time.time()
log = lambda *a: print("[%6.1fs]" % (time.time() - T0), *a, flush=True)

parts = json.load(open(os.path.join(CACHE, "parts.json"), encoding="utf8"))


def read_stl(path):
    raw = np.fromfile(path, dtype=np.uint8)
    n = int(raw[80:84].view("<u4")[0])
    rec = np.frombuffer(raw[84:84 + n * 50].tobytes(), dtype=np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")]))
    return np.ascontiguousarray(rec["v"].reshape(-1, 3))


def weld(v):
    key = v.view(np.dtype((np.void, v.dtype.itemsize * 3))).ravel()
    uniq, inv = np.unique(key, return_inverse=True)
    verts = uniq.view(np.float32).reshape(-1, 3)
    faces = inv.reshape(-1, 3).astype(np.int32)
    ok = (faces[:, 0] != faces[:, 1]) & (faces[:, 1] != faces[:, 2]) & (faces[:, 0] != faces[:, 2])
    return verts, faces[ok]


def area_of(co, tri):
    a, b, c = co[tri[:, 0]], co[tri[:, 1]], co[tri[:, 2]]
    return float(np.linalg.norm(np.cross(b - a, c - a), axis=1).sum() / 2)


def decimate(name, verts, faces, target):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [], faces.tolist())
    mesh.update()
    mesh.validate(verbose=False)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    count = len(mesh.polygons)
    if count > target:
        mod = obj.modifiers.new("decimate", "DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = target / count
        mod.use_collapse_triangulate = True
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
    nt = len(out.loop_triangles)
    tri = np.empty(nt * 3, np.int32)
    out.loop_triangles.foreach_get("vertices", tri)
    shown.to_mesh_clear()
    bpy.data.objects.remove(obj)
    bpy.data.meshes.remove(mesh)
    co, no, tri = co.reshape(-1, 3), no.reshape(-1, 3), tri.reshape(-1, 3)
    used = np.zeros(nv, bool)
    used[tri.ravel()] = True
    remap = np.cumsum(used) - 1
    return co[used], no[used], remap[tri].astype(np.int32)


def components(nv, tri):
    parent = list(range(nv))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    for a, b, c in tri.tolist():
        ra, rb, rc = find(a), find(b), find(c)
        if ra != rb:
            parent[rb] = ra
        if ra != rc:
            parent[find(rc)] = ra
    return np.array([find(i) for i in range(nv)], np.int64)


def keep_shell(co, no, tri, share):
    """Drop connected pieces smaller than `share` of the triangles (linings inside the skin)."""
    comp = components(len(co), tri)
    tri_comp = comp[tri[:, 0]]
    ids, counts = np.unique(tri_comp, return_counts=True)
    keep = set(ids[counts >= share * len(tri)].tolist())
    log("   pieces:", len(ids), "largest", sorted(counts.tolist(), reverse=True)[:6], "kept", len(keep))
    mask = np.array([c in keep for c in tri_comp.tolist()])
    tri = tri[mask]
    used = np.zeros(len(co), bool)
    used[tri.ravel()] = True
    remap = np.cumsum(used) - 1
    return co[used], no[used], remap[tri].astype(np.int32)


def build_structure(s):
    cache = os.path.join(DEC, "%s-%d.npz" % (s["id"], s["tris"]))
    if os.path.exists(cache) and not FRESH:
        z = np.load(cache, allow_pickle=False)
        return dict(co=z["co"], no=z["no"], tri=z["tri"], part=z["part"], src=int(z["src"]))
    loaded = []
    for f in s["files"]:
        verts, faces = weld(read_stl(os.path.join(STL, f["id"] + ".stl")))
        loaded.append((verts, faces, area_of(verts, faces)))
    total = sum(a for _, _, a in loaded) or 1.0
    co, no, tri, part = [], [], [], []
    base = 0
    for index, (verts, faces, area) in enumerate(loaded):
        target = max(MIN_PART, int(round(s["tris"] * area / total)))
        c, n, t = decimate(s["id"], verts, faces, target)
        if s["id"] == "piel":
            c, n, t = keep_shell(c, n, t, 0.02)
        co.append(c)
        no.append(n)
        tri.append(t + base)
        part.append(np.full(len(c), index, np.uint8))
        base += len(c)
    out = dict(co=np.concatenate(co), no=np.concatenate(no), tri=np.concatenate(tri), part=np.concatenate(part), src=sum(len(f) for _, f, _ in loaded))
    np.savez(cache, **out)
    return out


# ── 1. decimate ───────────────────────────────────────────────────────────
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj)
built = {}
for s in parts:
    t = time.time()
    b = build_structure(s)
    built[s["id"]] = b
    log("%-18s %8d -> %6d tris | %6d verts | %.1fs" % (s["id"], b["src"], len(b["tri"]), len(b["co"]), time.time() - t))
    if len(b["co"]) > 65535:
        raise SystemExit(s["id"] + " has more than 65535 vertices")

# Model space: x to the patient's left, y to the back, z up from the soles; the turntable's axis is z.
floor = float(built["piel"]["co"][:, 2].min())
for b in built.values():
    b["co"] = (b["co"] - np.array([0.0, AXIS_Y, floor], np.float32)).astype(np.float32)
    b["flow"] = np.zeros(len(b["co"]), np.float32)
    b["ao"] = np.ones(len(b["co"]), np.float32)

# ── 2. ambient occlusion ──────────────────────────────────────────────────
# A structure is shaded only by its own kind (bones by bones, soft tissue by soft tissue, brain by
# brain), so hiding a layer never leaves its shadow printed on what is underneath.
groups = {}
for s in parts:
    if s["id"] != "piel":
        groups.setdefault("blando" if s["layer"] in ("organo", "vaso") else s["layer"], []).append(s["id"])


def tree_of(ids):
    verts, polys, base = [], [], 0
    for sid in ids:
        b = built[sid]
        verts.append(b["co"])
        polys.append(b["tri"] + base)
        base += len(b["co"])
    return BVHTree.FromPolygons(np.concatenate(verts).tolist(), np.concatenate(polys).tolist(), all_triangles=True)


rng = np.random.default_rng(7)
# Cosine-weighted hemisphere directions, stratified.
side = int(math.ceil(math.sqrt(AO_RAYS)))
samples = []
for i in range(side):
    for j in range(side):
        u, v = (i + 0.5) / side, (j + 0.5) / side
        r, phi = math.sqrt(u), 2 * math.pi * v
        samples.append((r * math.cos(phi), r * math.sin(phi), math.sqrt(max(0.0, 1 - u))))
samples = np.array(samples[:AO_RAYS], np.float32)


def bake_ao(b, tree):
    co, no = b["co"], b["no"]
    n = no / np.maximum(np.linalg.norm(no, axis=1, keepdims=True), 1e-6)
    helper = np.where(np.abs(n[:, [2]]) < 0.9, np.array([[0, 0, 1.0]], np.float32), np.array([[1.0, 0, 0]], np.float32))
    t1 = np.cross(helper, n)
    t1 /= np.maximum(np.linalg.norm(t1, axis=1, keepdims=True), 1e-6)
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
    # One smoothing pass over the mesh takes the sampling grain out.
    acc = out.copy()
    cnt = np.ones(len(co), np.float32)
    for a, c in ((0, 1), (1, 2), (2, 0)):
        np.add.at(acc, b["tri"][:, a], out[b["tri"][:, c]])
        np.add.at(cnt, b["tri"][:, a], 1)
        np.add.at(acc, b["tri"][:, c], out[b["tri"][:, a]])
        np.add.at(cnt, b["tri"][:, c], 1)
    return acc / cnt


t = time.time()
for group, ids in groups.items():
    tree = tree_of(ids)
    for sid in ids:
        built[sid]["ao"] = bake_ao(built[sid], tree)
    log("occlusion:", group, len(ids), "structures")
log("occlusion baked | %d rays per vertex | %.0fs" % (AO_RAYS, time.time() - t))


# ── 3. flow coordinate ────────────────────────────────────────────────────
def graph_of(co, tri):
    adj = [[] for _ in range(len(co))]
    e = np.concatenate([tri[:, [0, 1]], tri[:, [1, 2]], tri[:, [2, 0]]])
    e = np.unique(np.sort(e, axis=1), axis=0)
    length = np.linalg.norm(co[e[:, 0]] - co[e[:, 1]], axis=1)
    for (a, c), l in zip(e.tolist(), length.tolist()):
        adj[a].append((c, l))
        adj[c].append((a, l))
    return adj


def geodesic(co, tri, seeds):
    """Distance along the surface from the seed vertices; loose pieces join at their nearest gap."""
    n = len(co)
    adj = graph_of(co, tri)
    dist = [math.inf] * n
    heap = []
    for v, d in seeds.items():
        dist[v] = d
        heap.append((d, v))
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
                    dist[w] = nd
                    heapq.heappush(heap, (nd, w))
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


def merged(ids):
    co, tri, spans, base = [], [], {}, 0
    for sid in ids:
        b = built[sid]
        co.append(b["co"])
        tri.append(b["tri"] + base)
        spans[sid] = (base, base + len(b["co"]))
        base += len(b["co"])
    return np.concatenate(co), np.concatenate(tri), spans


def nearest(co, point, lo=0, hi=None):
    hi = len(co) if hi is None else hi
    return lo + int(np.argmin(np.linalg.norm(co[lo:hi] - np.asarray(point, np.float32), axis=1)))


def part_span(sid, name):
    s = next(p for p in parts if p["id"] == sid)
    index = next(i for i, f in enumerate(s["files"]) if f["name"] == name)
    where = np.nonzero(built[sid]["part"] == index)[0]
    return int(where[0]), int(where[-1]) + 1


def flow_tree(ids, seed_of):
    co, tri, spans = merged(ids)
    d = geodesic(co, tri, seed_of(co, spans))
    for sid, (lo, hi) in spans.items():
        built[sid]["flow"] = d[lo:hi]


def each_piece(sid, pick):
    """One seed per connected piece of a structure."""
    b = built[sid]
    comp = components(len(b["co"]), b["tri"])
    seeds = {}
    for c in np.unique(comp):
        where = np.nonzero(comp == c)[0]
        seeds[int(where[pick(b["co"][where])])] = 0.0
    return seeds


heart = built["corazon"]["co"].mean(axis=0)
liver = built["higado"]["co"].mean(axis=0)
t = time.time()


def aortic_root(co, spans):
    lo, hi = part_span("aorta", "ascending aorta")
    lo, hi = lo + spans["aorta"][0], hi + spans["aorta"][0]
    return {lo + int(np.argmin(co[lo:hi, 2])): 0.0}


flow_tree(["aorta", "carotidas", "subclavias", "tronco-celiaco", "mesentericas", "art-renales", "art-iliacas", "cor-izq", "cor-da", "cor-cx", "cor-der"], aortic_root)
flow_tree(["art-pulmonar"], lambda co, spans: {nearest(co, heart): 0.0})
flow_tree(["vcs", "yugulares"], lambda co, spans: {nearest(co, heart, *spans["vcs"]): 0.0})
flow_tree(["vci", "ven-renales", "ven-iliacas"], lambda co, spans: {nearest(co, heart, *spans["vci"]): 0.0})
flow_tree(["venas-cardiacas"], lambda co, spans: {nearest(co, heart + np.array([-20.0, 25.0, 0.0], np.float32)): 0.0})
flow_tree(["porta"], lambda co, spans: {nearest(co, liver): 0.0})
built["ven-pulmonares"]["flow"] = geodesic(built["ven-pulmonares"]["co"], built["ven-pulmonares"]["tri"], each_piece("ven-pulmonares", lambda c: int(np.argmin(np.linalg.norm(c - heart, axis=1)))))
flow_tree(["traquea", "bronquios"], lambda co, spans: {spans["traquea"][0] + int(np.argmax(co[spans["traquea"][0]:spans["traquea"][1], 2])): 0.0})
built["ureteres"]["flow"] = geodesic(built["ureteres"]["co"], built["ureteres"]["tri"], each_piece("ureteres", lambda c: int(np.argmax(c[:, 2]))))

# The gut is a chain: each organ starts where it comes closest to the one before it.
chain = ["esofago", "estomago", "duodeno", "yeyuno", "ileon", "colon", "recto"]
prev = None
for sid in chain:
    b = built[sid]
    if prev is None:
        seeds = {int(np.argmax(b["co"][:, 2])): 0.0}
    else:
        p = built[prev]
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
    log("   gut %-9s %6.0f -> %6.0f mm" % (sid, float(b["flow"].min()), float(b["flow"].max())))
    prev = sid
colon = built["colon"]
app = built["apendice"]
j = nearest(colon["co"], app["co"].mean(axis=0))
app["flow"] = geodesic(app["co"], app["tri"], {nearest(app["co"], colon["co"][j]): float(colon["flow"][j])})
log("flow baked | %.0fs" % (time.time() - t))

# ── 4. write ──────────────────────────────────────────────────────────────
every = np.concatenate([b["co"] for b in built.values()])
lo = every.min(axis=0) - 1.0
hi = every.max(axis=0) + 1.0
size = hi - lo


def octa(n):
    n = n / np.maximum(np.abs(n).sum(axis=1, keepdims=True), 1e-9)
    xy = n[:, :2].copy()
    neg = n[:, 2] < 0
    sign = np.where(xy >= 0, 1.0, -1.0)
    xy[neg] = ((1 - np.abs(xy[neg][:, ::-1])) * sign[neg])
    return np.clip(np.round(xy * 127), -127, 127).astype(np.int8)


def morton(q):
    def spread(v):
        v = v.astype(np.uint64)
        v = (v | (v << np.uint64(16))) & np.uint64(0x030000FF)
        v = (v | (v << np.uint64(8))) & np.uint64(0x0300F00F)
        v = (v | (v << np.uint64(4))) & np.uint64(0x030C30C3)
        v = (v | (v << np.uint64(2))) & np.uint64(0x09249249)
        return v
    return spread(q[:, 0]) | (spread(q[:, 1]) << np.uint64(1)) | (spread(q[:, 2]) << np.uint64(2))


def zig16(values):
    d = np.diff(values.astype(np.int64), prepend=0).astype(np.int16).astype(np.int32)
    return ((d << 1) ^ (d >> 15)).astype(np.uint16)


def zig8(values):
    d = np.diff(values.astype(np.int64), prepend=0).astype(np.int8).astype(np.int32)
    return (((d << 1) ^ (d >> 7)) & 255).astype(np.uint8)


def pack(b):
    """Byte planes of zigzag deltas: triangles in Morton order, vertices in order of first use."""
    co, tri = b["co"], b["tri"]
    centre = co[tri].mean(axis=1)
    span = np.maximum(centre.max(axis=0) - centre.min(axis=0), 1e-6)
    tri = tri[np.argsort(morton(np.clip(((centre - centre.min(axis=0)) / span * 1023).astype(np.int64), 0, 1023)), kind="stable")]
    flat = tri.ravel()
    uniq, first = np.unique(flat, return_index=True)
    old = uniq[np.argsort(first, kind="stable")]
    remap = np.empty(len(co), np.int64)
    remap[old] = np.arange(len(old))
    flat = remap[flat]
    top = np.concatenate([[-1], np.maximum.accumulate(flat)[:-1]])
    codes = np.where(flat > top, 0, top + 1 - flat).astype(np.uint16)
    p = np.clip(np.round((co[old] - lo) / size * 65535), 0, 65535).astype(np.uint16)
    flow = np.clip(np.round(b["flow"][old] * 8), 0, 65535).astype(np.uint16)
    n = octa(b["no"][old].astype(np.float64)).view(np.uint8)
    ao = np.clip(np.round(b["ao"][old] * 255), 0, 255).astype(np.uint8)
    planes = []
    for field in (p[:, 0], p[:, 1], p[:, 2], flow):
        z = zig16(field)
        planes += [(z & 255).astype(np.uint8), (z >> 8).astype(np.uint8)]
    planes += [zig8(n[:, 0]), zig8(n[:, 1]), zig8(ao), b["part"][old].astype(np.uint8)]
    planes += [(codes & 255).astype(np.uint8), (codes >> 8).astype(np.uint8)]
    return b"".join(x.tobytes() for x in planes), len(old), int(flat.size)


chunks, meta, offset = [], [], 0
for s in parts:
    b = built[s["id"]]
    data, nv, ni = pack(b)
    names = []
    for index, f in enumerate(s["files"]):
        mask = b["part"] == index
        where = b["co"][mask]
        along = b["flow"][mask]
        names.append({"n": f["name"], "c": [round(float(x), 1) for x in where.mean(axis=0)], "lo": [round(float(x), 1) for x in where.min(axis=0)], "hi": [round(float(x), 1) for x in where.max(axis=0)], "flow": [round(float(along.min()), 1), round(float(along.max()), 1)]})
    meta.append({
        "id": s["id"], "layer": s["layer"], "kind": s["kind"],
        "v": [offset, nv], "i": [offset + 12 * nv, ni],
        "lo": [round(float(x), 1) for x in b["co"].min(axis=0)], "hi": [round(float(x), 1) for x in b["co"].max(axis=0)],
        "c": [round(float(x), 1) for x in b["co"].mean(axis=0)],
        "flow": [round(float(b["flow"].min()), 1), round(float(b["flow"].max()), 1)],
        "parts": names,
    })
    chunks.append(data)
    offset += len(data)

# The heart's long axis, base to apex, for the beat.
hc = built["corazon"]["co"].astype(np.float64)
centre = hc.mean(axis=0)
axis = np.linalg.svd(hc - centre, full_matrices=False)[2][0]
if np.dot(axis, [0.5, -0.5, -0.7]) < 0:
    axis = -axis
along = (hc - centre) @ axis
heart_info = {"base": [round(float(x), 1) for x in centre + axis * along.min()], "axis": [round(float(x), 4) for x in axis], "length": round(float(along.max() - along.min()), 1)}

blob = b"".join(chunks)
os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
with open(os.path.join(ROOT, "docs", "body.bin.gz"), "wb") as f:
    f.write(gzip.compress(blob, 9, mtime=0))
info = {
    "bytes": len(blob), "lo": [round(float(x), 2) for x in lo], "size": [round(float(x), 2) for x in size],
    "vertices": int(sum(m["v"][1] for m in meta)), "triangles": int(sum(m["i"][1] for m in meta) // 3), "heart": heart_info,
    "structs": meta,
}
with open(os.path.join(ROOT, "src", "body.json"), "w", encoding="utf8") as f:
    json.dump(info, f, separators=(",", ":"))
log("wrote docs/body.bin.gz | %.2f MB raw | %.2f MB gzip | %d vertices | %d triangles" % (len(blob) / 1e6, os.path.getsize(os.path.join(ROOT, "docs", "body.bin.gz")) / 1e6, info["vertices"], info["triangles"]))
