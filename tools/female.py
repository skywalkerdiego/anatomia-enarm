# Female pelvic organs and mammary glands, modelled from landmarks of the reshaped body.
#
# No open dataset has a female pelvis to match BodyParts3D, so the organs are built here from
# metaballs (soft shapes that blend into one surface: a pear-shaped uterus running into its
# cervix and the vaginal vault) and swept tubes (uterine tubes, ligaments, vessels), sized from
# adult anatomy and placed against this body's pelvis, bladder and rectum.
#
# Used by build_model.py; tools/female_preview.py renders it on its own for a quick look.
import math
import bpy
import numpy as np

MB = 0.574  # surface radius of a metaball element of radius 1 (stiffness 2, threshold 0.6)


def unit(v):
    v = np.asarray(v, np.float64)
    return v / max(np.linalg.norm(v), 1e-9)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def quat_from_axes(ax, ay):
    """Quaternion (w, x, y, z) of the rotation taking +x to ax and +y to ay."""
    ax = unit(ax)
    ay = unit(ay - ax * np.dot(ay, ax))
    az = np.cross(ax, ay)
    m = np.array([ax, ay, az]).T
    tr = m[0, 0] + m[1, 1] + m[2, 2]
    if tr > 0:
        s = math.sqrt(tr + 1) * 2
        return (0.25 * s, (m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s)
    if m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = math.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2
        return ((m[2, 1] - m[1, 2]) / s, 0.25 * s, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s)
    if m[1, 1] > m[2, 2]:
        s = math.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2
        return ((m[0, 2] - m[2, 0]) / s, (m[0, 1] + m[1, 0]) / s, 0.25 * s, (m[1, 2] + m[2, 1]) / s)
    s = math.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2
    return ((m[1, 0] - m[0, 1]) / s, (m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, 0.25 * s)


class Blob:
    """A metaball family: add balls, ellipsoids and capsules in surface millimetres."""
    count = 0

    def __init__(self, resolution=0.9):
        Blob.count += 1
        self.name = "blob%03d" % Blob.count   # a unique base name: metaballs of one name merge
        self.mb = bpy.data.metaballs.new(self.name)
        self.mb.resolution = resolution
        self.mb.render_resolution = resolution
        self.mb.threshold = 0.6

    def ball(self, c, r, negative=False):
        e = self.mb.elements.new(type="BALL")
        e.co = tuple(map(float, c)); e.radius = r / MB; e.use_negative = negative
        return self

    def ellipsoid(self, c, half, ax=(1, 0, 0), ay=(0, 1, 0)):
        """Half-axes (a, b, c) along ax, ay and their cross product."""
        r = max(half)
        e = self.mb.elements.new(type="ELLIPSOID")
        e.co = tuple(map(float, c)); e.radius = r / MB
        e.size_x, e.size_y, e.size_z = half[0] / r, half[1] / r, half[2] / r
        e.rotation = quat_from_axes(ax, ay)
        return self

    def capsule(self, a, b, r):
        a, b = np.asarray(a, float), np.asarray(b, float)
        d = b - a
        length = np.linalg.norm(d)
        helper = (0, 0, 1) if abs(unit(d)[2]) < 0.9 else (1, 0, 0)
        e = self.mb.elements.new(type="CAPSULE")
        e.co = tuple(map(float, (a + b) / 2)); e.radius = r / MB
        e.size_x = length / 2
        e.rotation = quat_from_axes(d, np.cross(helper, d))
        return self

    def chain(self, points, radius):
        """Capsules along a polyline; radius(t) for t in 0..1."""
        n = len(points)
        for i in range(n - 1):
            self.capsule(points[i], points[i + 1], radius((i + 0.5) / (n - 1)))
        return self

    def mesh(self):
        ob = bpy.data.objects.new(self.name, self.mb)
        bpy.context.scene.collection.objects.link(ob)
        dg = bpy.context.evaluated_depsgraph_get()
        dg.update()
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        me.calc_loop_triangles()
        co = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get("co", co)
        tri = np.empty(len(me.loop_triangles) * 3, np.int32); me.loop_triangles.foreach_get("vertices", tri)
        bpy.data.objects.remove(ob)
        bpy.data.meshes.remove(me)
        bpy.data.metaballs.remove(self.mb)
        return co.reshape(-1, 3), tri.reshape(-1, 3)


def finish(name, co, tri, target=None, smooth=0):
    """Weld, optionally smooth and decimate; returns (name, co, normals, tri)."""
    me = bpy.data.meshes.new(name)
    me.from_pydata(np.asarray(co).tolist(), [], np.asarray(tri).tolist())
    me.update()
    me.validate(verbose=False)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if smooth:
        mod = ob.modifiers.new("smooth", "LAPLACIANSMOOTH")
        mod.iterations = smooth
        mod.lambda_factor = 0.4
        mod.use_volume_preserve = True
    if target and len(me.polygons) > target:
        mod = ob.modifiers.new("decimate", "DECIMATE")
        mod.ratio = target / len(me.polygons)
        mod.use_collapse_triangulate = True
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    ev = ob.evaluated_get(dg)
    out = ev.to_mesh()
    out.calc_loop_triangles()
    c = np.empty(len(out.vertices) * 3, np.float32); out.vertices.foreach_get("co", c)
    n = np.empty(len(out.vertices) * 3, np.float32); out.vertex_normals.foreach_get("vector", n)
    t = np.empty(len(out.loop_triangles) * 3, np.int32); out.loop_triangles.foreach_get("vertices", t)
    ev.to_mesh_clear()
    bpy.data.objects.remove(ob)
    bpy.data.meshes.remove(me)
    return (name, c.reshape(-1, 3), n.reshape(-1, 3), t.reshape(-1, 3))


# ── curves and swept tubes ──────────────────────────────────────────────────
def curve(points, n=16):
    """Catmull-Rom through control points, n samples per span."""
    P = np.asarray(points, np.float64)
    P = np.vstack([P[0] * 2 - P[1], P, P[-1] * 2 - P[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return np.array(out)


def resample(points, step):
    """Evenly spaced points along a polyline."""
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))]
    n = max(2, int(math.ceil(d[-1] / step)) + 1)
    s = np.linspace(0, d[-1], n)
    return np.array([np.interp(s, d, points[:, k]) for k in range(3)]).T


def tortuous(points, amp, waves, normal=(0, 1, 0)):
    """Add a winding to a path (the uterine artery's spiral course)."""
    n = len(points)
    t = np.linspace(0, 1, n)
    T = np.gradient(points, axis=0)
    T /= np.maximum(np.linalg.norm(T, axis=1, keepdims=True), 1e-9)
    side = np.cross(T, np.asarray(normal, float))
    side /= np.maximum(np.linalg.norm(side, axis=1, keepdims=True), 1e-9)
    up = np.cross(side, T)
    ph = t * waves * 2 * math.pi
    return points + side * (np.sin(ph) * amp)[:, None] + up * (np.cos(ph) * amp * 0.6)[:, None]


def sweep(points, radius, ring=14, open_end=False, flat=1.0, ref=(0, 0, 1)):
    """A tube along points with radius(t); ends close smoothly to a point unless open_end."""
    P = np.asarray(points, np.float64)
    m = len(P)
    T = np.gradient(P, axis=0)
    T /= np.maximum(np.linalg.norm(T, axis=1, keepdims=True), 1e-9)
    ref = np.asarray(ref, float)
    if abs(np.dot(T[0], ref)) > 0.95:
        ref = np.array([1.0, 0, 0])
    N = np.cross(T[0], ref); N /= np.linalg.norm(N)
    verts = []
    for i in range(m):
        N = N - T[i] * np.dot(N, T[i]); N /= max(np.linalg.norm(N), 1e-9)
        B = np.cross(T[i], N)
        r = radius(i / (m - 1))
        a = np.linspace(0, 2 * np.pi, ring, endpoint=False)
        verts.append(P[i] + np.outer(np.cos(a) * r, N) + np.outer(np.sin(a) * r * flat, B))
    verts = np.concatenate(verts)
    faces = []
    for i in range(m - 1):
        for j in range(ring):
            a, b = i * ring + j, i * ring + (j + 1) % ring
            faces += [[a, a + ring, b], [b, a + ring, b + ring]]
    s = len(verts)
    tips = [P[0] - T[0] * radius(0) * 0.6]
    if not open_end:
        tips.append(P[-1] + T[-1] * radius(1) * 0.6)
    verts = np.vstack([verts, tips])
    for j in range(ring):
        faces.append([s, j, (j + 1) % ring])
        if not open_end:
            faces.append([s + 1, (m - 1) * ring + (j + 1) % ring, (m - 1) * ring + j])
    return verts.astype(np.float32), np.array(faces, np.int32)


def tube_piece(name, points, radius, ring=14, step=1.5, **kw):
    pts = resample(np.asarray(points, float), step)
    co, tri = sweep(pts, radius, ring, **kw)
    return finish(name, co, tri)


# ── landmarks ───────────────────────────────────────────────────────────────
def landmarks(get):
    """Points of this pelvis that the organs hang from. get(id) → {co, part, names}."""
    pel = get("pelvis")["co"]
    sac = get("sacro")["co"]
    mid = pel[np.abs(pel[:, 0]) < 8]
    front = mid[mid[:, 1] < np.percentile(mid[:, 1], 30)]
    L = {}
    L["sym_top"] = front[np.argmax(front[:, 2])]
    L["sym_bottom"] = front[np.argmin(front[:, 2])]
    top = sac[sac[:, 2] > sac[:, 2].max() - 25]
    L["promontory"] = top[np.argmin(top[:, 1])]
    sl = pel[(pel[:, 1] > 30) & (pel[:, 2] > L["sym_bottom"][2]) & (pel[:, 2] < L["sym_top"][2] + 30)]
    spine = sl[np.argmin(np.abs(sl[:, 0]))]
    L["spine"] = spine
    # Half-width of the pelvic wall at the level of the ovaries.
    z_ov = L["promontory"][2] - 40
    wall = pel[(np.abs(pel[:, 2] - z_ov) < 6) & (np.abs(pel[:, 1] - 20) < 30)]
    L["wall"] = float(np.percentile(np.abs(wall[:, 0]), 3)) if len(wall) else 55.0
    L["z_ov"] = z_ov
    # Iliac vessels: the external iliac artery at the brim, the internal iliac's anterior division.
    il = get("art-iliacas")
    for side, s in (("right", -1), ("left", 1)):
        ext = il["co"][il["part"] == il["names"].index(f"{side} external iliac artery")]
        L[f"ext_{side}"] = ext
        inn = il["co"][il["part"] == il["names"].index(f"{side} internal iliac artery")]
        L[f"int_{side}"] = inn
    return L


def rectum_front(rc, z):
    m = rc[(np.abs(rc[:, 2] - z) < 5) & (np.abs(rc[:, 0]) < 15)]
    return float(m[:, 1].min()) if len(m) else None


# ── bladder: flatter and further forward, making room for the uterus and vagina ──
def reshape_bladder(bl, ureters, keep=0.6):
    """Compress the bladder towards its front wall; drag the ends of the ureters along."""
    y0 = float(bl[:, 1].min())
    cx = float(bl[:, 0].mean())
    zlo, zhi = float(bl[:, 2].min()), float(bl[:, 2].max())
    def move(p, w):
        q = p.copy()
        q[:, 1] = p[:, 1] + w * ((y0 + (p[:, 1] - y0) * keep) - p[:, 1])
        q[:, 0] = p[:, 0] + w * ((cx + (p[:, 0] - cx) * 1.12) - p[:, 0])
        q[:, 2] = p[:, 2] + w * ((zlo + (p[:, 2] - zlo) * 0.94) - p[:, 2])
        return q
    new_bl = move(bl, np.ones(len(bl)))
    w = 1 - smoothstep(zhi - 5, zhi + 45, ureters[:, 2])
    return new_bl.astype(np.float32), move(ureters, w).astype(np.float32)


# ── the organs ──────────────────────────────────────────────────────────────
def pelvic_organs(get, introitus):
    """Pieces for utero, vagina, ovarios, trompas, vasos-gonadales, ven-gonadales."""
    L = landmarks(get)
    bl, rc = get("vejiga")["co"], get("recto")["co"]
    out = {k: [] for k in ("utero", "vagina", "ovarios", "trompas", "vasos-gonadales", "ven-gonadales")}

    # The external os sits at the level of the ischial spines, between the bladder and the rectum.
    z_os = float(L["spine"][2])
    bl_back = bl[(np.abs(bl[:, 2] - z_os) < 8) & (np.abs(bl[:, 0]) < 15)]
    y_front = float(bl_back[:, 1].max()) if len(bl_back) else 15.0
    y_back = rectum_front(rc, z_os) or y_front + 30
    ext_os = np.array([0.0, (y_front + y_back) / 2 + 2, z_os])
    cervix_ax = unit([0, -0.5, 0.866])                  # cervix points up and forward
    body_ax = unit([0, -0.84, 0.54])                    # the body bends further forward over the bladder
    int_os = ext_os + cervix_ax * 26
    side = np.array([1.0, 0, 0])
    thick_ax = lambda ax: unit(np.cross(ax, side))      # front-back within the organ
    # Uterus: a pear widening to a domed fundus, with the cornua at its upper corners.
    u = Blob(0.8)
    u.ellipsoid(int_os + body_ax * 27, (24, 23, 15), body_ax, side)          # body
    u.ellipsoid(int_os + body_ax * 36, (14, 25, 14), body_ax, side)          # fundus breadth
    u.ellipsoid(int_os + body_ax * 6, (10, 13, 11), body_ax, side)           # isthmus
    u.capsule(ext_os + cervix_ax * 3, int_os, 12)                             # cervix
    corner = {}
    for s in (-1, 1):
        corner[s] = int_os + body_ax * 41 + side * s * 21 - thick_ax(body_ax) * 2
        u.ball(corner[s], 6.5)
    co, tri = u.mesh()
    out["utero"].append(finish("body of uterus", co, tri, target=9000, smooth=4))
    # The cervix again on its own, slightly smaller, so it can be picked out (it shows within the vault).
    cv = Blob(0.6).capsule(ext_os - cervix_ax * 1.5, ext_os + cervix_ax * 14, 11.5)
    co, tri = cv.mesh()
    out["utero"].append(finish("cervix of uterus", co, tri, target=2500, smooth=2))

    # Vagina: a flattened tube from the introitus up and back to the vault around the cervix.
    vault = ext_os + np.array([0, 5, -3])
    path = curve([introitus, introitus + (vault - introitus) * 0.35 + np.array([0, 2, 0]), introitus + (vault - introitus) * 0.7, vault], 10)
    pts = resample(path, 2.5)
    v = Blob(0.8)
    va = unit(vault - introitus)
    for i, p in enumerate(pts):
        t = i / (len(pts) - 1)
        # Collapsed: an H-shaped slit low down, rounder towards the vault.
        half_w = 12 + 5 * t ** 1.2
        half_t = 4.0 + 5.0 * t ** 1.3
        v.ellipsoid(p, (6 if i == 0 else 8, half_w, half_t), va, side)
    v.ellipsoid(vault + np.array([0, 4, 0]), (12, 18, 12), va, side)         # the fornices
    co, tri = v.mesh()
    out["vagina"].append(finish("vagina", co, tri, target=6000, smooth=3))
    # Female urethra: from the neck of the bladder to the vestibule, in front of the vagina.
    # Female urethra: from the neck of the bladder down along the front wall of the vagina to the
    # meatus, just in front of the vaginal opening.
    neck = bl[np.argmin(bl[:, 2] + np.abs(bl[:, 0]) * 2 - bl[:, 1] * 0.2)]
    front = -unit(np.cross(va, side))
    along = [pts[int(round(t * (len(pts) - 1)))] + front * (6.5 + 2.5 * t + 4.5) for t in (0.0, 0.2, 0.42)]
    path = curve([along[0] + np.array([0, -1, -1]), along[1], along[2], neck + np.array([0, 0, 2])], 10)
    out["vagina"].append(tube_piece("female urethra", path, lambda t: 2.6 + 0.6 * t, 12, 1.2))

    # Ovaries in the ovarian fossae, long axis nearly vertical; follicles bulge the surface.
    rng = np.random.default_rng(11)
    ovary = {}
    for s, name in ((-1, "right ovary"), (1, "left ovary")):
        c = np.array([s * (L["wall"] - 9), float(int_os[1]) + 6, L["z_ov"] - 2])
        ax = unit([s * 0.25, 0.2, 1])
        ovary[s] = (c, ax)
        o = Blob(0.6)
        o.ellipsoid(c, (15, 9, 6), ax, unit([s, 0, 0]))
        for k in range(9):
            d = unit(rng.normal(size=3))
            p = c + ax * d[0] * 11 + unit([s, 0, 0]) * d[1] * 6 + np.cross(ax, unit([s, 0, 0])) * d[2] * 7
            o.ball(p, rng.uniform(2.2, 3.6))
        co, tri = o.mesh()
        out["ovarios"].append(finish(name, co, tri, target=2600, smooth=2))

    # Uterine tubes: isthmus out from the cornu, the ampulla arching over the ovary, then the
    # infundibulum opening beside it with its fimbriae.
    for s, name in ((-1, "right uterine tube"), (1, "left uterine tube")):
        c, ax = ovary[s]
        c0 = corner[s] + side * s * 3
        top = c + ax * 17
        path = curve([c0, c0 + np.array([s * 14, 2, 1]), c0 + np.array([s * 26, 3, 3]), top + np.array([s * 2, -9, 9]),
                      top + np.array([s * 11, 1, 5]), c + np.array([s * 13, 9, 4]), c + np.array([s * 9, 13, -7])], 12)
        pts = resample(path, 1.2)
        r = lambda t: 1.9 + 2.6 * smoothstep(0.25, 0.75, t) + 3.4 * smoothstep(0.9, 1.0, t)
        co, tri = sweep(pts, r, 16, open_end=True)
        out["trompas"].append(finish(name, co, tri))
        end, T = pts[-1], unit(pts[-1] - pts[-4])
        n1 = unit(np.cross(T, [0, 0, 1])); n2 = np.cross(T, n1)
        for k in range(14):
            a = 2 * math.pi * k / 14 + rng.uniform(-0.1, 0.1)
            rim = end + (n1 * math.cos(a) + n2 * math.sin(a)) * 6.8
            out_dir = unit((n1 * math.cos(a) + n2 * math.sin(a)) * 0.9 + T * 0.6)
            length = rng.uniform(7, 12) * (1.7 if k == 0 else 1)
            tip = rim + out_dir * length + np.array([0, 0, -length * 0.35])
            if k == 0:                                      # the ovarian fimbria reaches the ovary
                tip = c + ax * 8 + unit([s, 0.4, 0]) * 6
            f = curve([rim, rim + out_dir * length * 0.5, tip], 6)
            out["trompas"].append(tube_piece("fimbriae", f, lambda t: 1.4 * (1 - 0.7 * t), 7, 1.0))

    # Ligaments: round (cornu → deep inguinal ring) and ovarian (cornu → ovary).
    for s, side_name in ((-1, "right"), (1, "left")):
        ext = L[f"ext_{side_name}"]
        ring = ext[np.argmin(ext[:, 1])] + np.array([s * 8, 4, 12])
        c0 = corner[s] + np.array([0, -5, -4])
        path = curve([c0, c0 + np.array([s * 18, -10, -2]), (c0 + ring) / 2 + np.array([0, 0, -6]), ring], 10)
        out["utero"].append(tube_piece("round ligament of uterus", path, lambda t: 2.0 - 0.6 * t, 10, 1.5))
        c, ax = ovary[s]
        c1 = corner[s] + np.array([0, 6, -6])
        path = curve([c1, c1 + (c - ax * 6 - c1) * 0.5 + np.array([0, 2, -3]), c - ax * 9 + np.array([-s * 4, 0, 0])], 8)
        out["utero"].append(tube_piece("ligament of ovary", path, lambda t: 2.2, 10, 1.2))

    # Uterine artery: from the internal iliac along the base of the broad ligament, over the ureter
    # beside the cervix, then winding up the side of the uterus to meet the ovarian artery.
    for s, side_name in ((-1, "right"), (1, "left")):
        inn = L[f"int_{side_name}"]
        start = inn[np.argmin(inn[:, 2] - inn[:, 1] * 0.3)]
        beside = int_os + side * s * 17 + np.array([0, 0, -6])
        path = curve([start, start + (beside - start) * 0.45 + np.array([0, -4, -8]), beside], 12)
        up = curve([beside, int_os + body_ax * 20 + side * s * 24, corner[s] + side * s * 4 + np.array([0, 4, -2])], 16)
        up = tortuous(resample(up, 1.2), 2.2, 9, normal=side)
        full = np.vstack([resample(path, 1.2), up[1:]])
        out["vasos-gonadales"].append(tube_piece(f"{side_name} uterine artery", full, lambda t: 1.8 - 0.5 * t, 10, 1.0))
        vag = curve([beside, beside + np.array([0, 8, -16]), vault + side * s * 13 + np.array([0, 0, -20])], 10)
        out["vasos-gonadales"].append(tube_piece(f"{side_name} vaginal artery", vag, lambda t: 1.3 - 0.4 * t, 8, 1.0))
        # Uterine veins: a pair on the same course, behind the artery.
        for k, off in enumerate((np.array([0, 4, -3]), np.array([0, -3, -5]))):
            vpath = np.vstack([resample(path, 1.5), resample(curve([beside, int_os + body_ax * 22 + side * s * 26], 10), 1.5)[1:]]) + off
            out["ven-gonadales"].append(tube_piece(f"{side_name} uterine vein", vpath, lambda t: 2.1 - 0.4 * t, 10, 1.5))
    return out, L, corner, ovary


def gonadal_vessels(get, ovary, out):
    """Ovarian arteries from the aorta and veins to the cava / left renal vein, in the suspensory ligaments."""
    ao = get("aorta")["co"]
    ren = get("art-renales")["co"]
    z_ren = float(np.percentile(ren[:, 2], 20)) - 25
    vci = get("vci")["co"]
    rv = get("ven-renales")
    for s, side_name in ((-1, "right"), (1, "left")):
        c, ax = ovary[s]
        top = c + ax * 15
        a_pt = ao[np.argmin(np.abs(ao[:, 2] - z_ren) * 3 + np.abs(ao[:, 0] - s * 6))]
        brim = np.array([s * 52.0, float(c[1]) - 6, float(c[2]) + 42])
        path = curve([a_pt + np.array([s * 3, -5, 0]), a_pt + np.array([s * 22, -2, -70]), brim + np.array([0, -4, 50]), brim, top + np.array([s * 5, 0, 5])], 14)
        out["vasos-gonadales"].append(tube_piece(f"{side_name} ovarian artery", path, lambda t: 1.4, 9, 2.0))
        if s < 0:
            drain = vci[np.argmin(np.abs(vci[:, 2] - (z_ren + 10)) * 3 + np.abs(vci[:, 0] + 8))]
        else:
            pts = rv["co"][rv["part"] == rv["names"].index("left renal vein")] if "left renal vein" in rv["names"] else rv["co"][rv["co"][:, 0] > 0]
            drain = pts[np.argmax(pts[:, 0] - np.abs(pts[:, 2] - pts[:, 2].min()))]
            drain = pts[np.argmin(np.abs(pts[:, 0] - 40))]
        path = curve([top + np.array([s * 8, 4, 3]), brim + np.array([s * 6, 5, 2]), brim + np.array([s * 4, 4, 55]), drain + np.array([0, 0, -60]) + np.array([s * 8, 0, 0]), drain], 14)
        out["ven-gonadales"].append(tube_piece(f"{side_name} ovarian vein", path, lambda t: 1.9 + 0.6 * t, 10, 2.0))
        # The pampiniform plexus around the top of the ovary.
        rng = np.random.default_rng(20 + s)
        for k in range(4):
            j = rng.normal(size=(5, 3)) * 2.2
            p = curve([top + np.array([s * 8, 4, 3]) + j[0], top + np.array([s * 4, 2, -3]) + j[1] * 1.5, c + ax * 4 + np.array([s * 6, 0, 0]) + j[2] * 1.5], 8)
            out["ven-gonadales"].append(tube_piece(f"{side_name} pampiniform plexus", p, lambda t: 1.0, 8, 1.0))


def chest_depth(nipple, inward, wall):
    """Distance from the nipple back to the chest wall (pectoralis major) along inward."""
    inward = unit(inward)
    d = wall - nipple
    along = d @ inward
    off = np.linalg.norm(d - np.outer(along, inward), axis=1)
    near = along[(off < 22) & (along > 5)]
    return float(near.min()) if len(near) else 45.0


def mammary(nipple, inward, rng, out_list, depth=45.0):
    """One mammary gland: 18 lobes of lobules fanned around the nipple, their lactiferous ducts
    (with the sinus just behind the nipple) converging on it. The lobes reach back to the chest
    wall, depth mm behind the nipple."""
    inward = unit(inward)
    u = unit(np.cross(inward, [0, 0, 1.0])); v = np.cross(inward, u)
    axilla = math.atan2(0.55, float(np.sign(nipple[0])) * np.sign(u[0]) * 0.85)
    g = Blob(1.0)
    lobes = 18
    for k in range(lobes):
        a = 2 * math.pi * k / lobes + rng.uniform(-0.1, 0.1)
        radial = u * math.cos(a) + v * math.sin(a)
        # The upper outer quadrant, towards the axilla, holds more tissue (the axillary tail).
        reach = 40 + rng.uniform(-4, 5) + 18 * max(0.0, math.cos(a - axilla)) ** 3
        base = nipple + inward * (depth * 0.32 + rng.uniform(-2, 2)) + radial * 11
        tip = nipple + inward * (depth * 0.82 + rng.uniform(-3, 2)) + radial * reach
        sinus = nipple + inward * 6 + radial * 2.5
        for i in range(9):
            t = i / 8
            p = base + (tip - base) * t + (u * rng.normal() + v * rng.normal()) * (1.6 + 1.0 * t) + inward * rng.normal() * 1.8
            g.ball(p, (9.5 - 2.0 * t) * rng.uniform(0.94, 1.05))
        duct = curve([nipple + inward * 1.5, sinus, base + (tip - base) * 0.2], 8)
        out_list.append(tube_piece("lactiferous duct", duct, lambda t: 1.0 + 1.1 * math.exp(-((t - 0.3) / 0.13) ** 2) - 0.2 * t, 8, 1.0))
    co, tri = g.mesh()
    out_list.insert(0, finish("lobes of mammary gland", co, tri, target=12000, smooth=8))


def introitus_from(skin, sym_bottom):
    """The vaginal opening: in the vulvar cleft, behind and below the pubic symphysis."""
    y = float(sym_bottom[1]) + 22
    m = skin[(np.abs(skin[:, 0]) < 5) & (np.abs(skin[:, 1] - y) < 6) & (skin[:, 2] < sym_bottom[2])]
    z = float(m[:, 2].max()) + 9 if len(m) else float(sym_bottom[2]) - 18
    return np.array([0.0, y, z])


def nipples_from(skin):
    """The apex of each breast (its most anterior skin point), made symmetric."""
    found = {}
    for s in (-1, 1):
        m = skin[(skin[:, 0] * s > 35) & (skin[:, 0] * s < 150) & (skin[:, 2] > 0.62 * skin[:, 2].max()) & (skin[:, 2] < 0.8 * skin[:, 2].max())]
        found[s] = m[np.argmin(m[:, 1])]
    x = (abs(found[-1][0]) + abs(found[1][0])) / 2
    y = (found[-1][1] + found[1][1]) / 2
    z = (found[-1][2] + found[1][2]) / 2
    return {s: np.array([s * x, y, z]) for s in (-1, 1)}
