import { k, G, A, DEG, scene, egg } from "./geo.mjs";

export const W = 600;
export const H = 760;
export const AZIMUTH = 30;
export const ELEVATION = 22;

// World: x anterior, z up, +y = patient's RIGHT (drawn on the viewer's left), 1 unit = 2 mm.
export const BASE_DISC = [-10, 0, 84];
export const BASE = { x: -94, y: -84, w: 168, d: 168, r: 84 };
const BASE_H = 11;
const FOOT_H = 6;
const SEAT_Z = 42;

// Vertebral column, bottom (L5) to top (T1).
const LUMBAR = ["L5", "L4", "L3", "L2", "L1"];
const THORACIC = ["T12", "T11", "T10", "T9", "T8", "T7", "T6", "T5", "T4", "T3", "T2", "T1"];
export const LEVELS = {};
{
  let z = 76;
  for (const name of LUMBAR) {
    LEVELS[name] = { z0: z, z1: z + 13, r: 10.6, lumbar: true };
    z += 13 + 4.5;
  }
  THORACIC.forEach((name, index) => {
    LEVELS[name] = { z0: z, z1: z + 11, r: 9.2 - index * 0.18, lumbar: false };
    z += 11 + 2.8;
  });
  LEVELS.C7 = { z0: z, z1: z + 7.6, r: 6.6, lumbar: false, cervical: true };
}
export const NECK_Z = LEVELS.C7.z1 + 0.6;
const NECK_H = 5.4;
export const spineX = (z) => -31 + 5 * Math.cos((Math.PI * (z - 110)) / 140);
export const levelZ = (name, share = 0.5) => LEVELS[name].z0 + (LEVELS[name].z1 - LEVELS[name].z0) * share;

export const DOMES = {
  r: { c: [-6, 44], R: 37, rim: 200, apex: 236 },
  l: { c: [-10, -50], R: 35, rim: 196, apex: 229 },
};
const domeZ = (d, rho) => d.rim + (d.apex - d.rim) * Math.sqrt(Math.max(0, 1 - (rho / d.R) ** 2));
export const LUNGS = {
  r: { dome: DOMES.r, Rb: 33, apex: 326 },
  l: { dome: DOMES.l, Rb: 30, apex: 324 },
};
for (const L of Object.values(LUNGS)) L.rim = domeZ(L.dome, L.Rb) + 0.8;
export const lungR = (L, z) => {
  if (z < L.rim) return L.Rb;
  const t = Math.min(1, (z - L.rim) / (L.apex - L.rim));
  return L.Rb * Math.pow(Math.max(0, 1 - Math.pow(t, 2.4)), 0.5);
};
export const HEART = { c: [16, -8, 247], a: G.unit3([0.5, -0.55, -0.67]), back: 27, L: 60, R: 23 };

const ramp = (stops) => (t) => {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, r0] = stops[i - 1];
      const [t1, r1] = stops[i];
      const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      return r0 + (r1 - r0) * u * u * (3 - 2 * u);
    }
  }
  return stops[stops.length - 1][1];
};

export function projection() {
  const rim = Array.from({ length: 48 }, (_, i) => [BASE_DISC[0] + BASE_DISC[2] * Math.cos((i / 48) * Math.PI * 2), BASE_DISC[1] + BASE_DISC[2] * Math.sin((i / 48) * Math.PI * 2)]);
  const pts = [...rim.map(([x, y]) => [x, y, -BASE_H - 4]), ...rim.map(([x, y]) => [x, y, 0]), [-30, 0, NECK_Z + NECK_H + 4], [-6, 88, 260], [-10, -90, 260], [-66, 0, NECK_Z + 2]];
  return k.fitProjection(pts, W, H, { pad: 20, azimuth: AZIMUTH, elevation: ELEVATION });
}

export function build(P) {
  const $ = scene(P);
  const { R, at, S, Ln, Dots, put, organ, ball, turned, slab, cyl, prism, tube, surfaceCurve, surfaceAt, slopeOf } = $;
  const back = [];
  const anchors = {};
  const note = (piece, point) => (anchors[piece] = anchors[piece] ?? point);

  // ---------- Round base on feet, with degree ticks ----------
  const [BX, BY, BR] = BASE_DISC;
  back.push(`<path class="iso-halo" d="${k.haloOf({ x: BX - BR, y: BY - BR, w: 2 * BR, d: 2 * BR, r: BR }, -BASE_H - FOOT_H, BASE_H, P)}"/>`);
  const feet = Array.from({ length: 6 }, (_, i) => [BX + (BR - 14) * Math.cos((i * 60 + 30) * DEG), BY + (BR - 14) * Math.sin((i * 60 + 30) * DEG)]);
  feet.sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    back.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    back.push(S(k.cylinder(x, y, 6, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  back.push(S(k.cylinder(BX, BY, BR, -BASE_H, BASE_H, P, 120, 1.4), { tone: "mid", inner: Ln(k.sideArc(BX, BY, BR, -BASE_H + 3.4, P, 96), { tone: "faint" }) }));
  back.push(Ln(k.ring(BX, BY, BR - 6, 0, P, 120) + k.ring(BX, BY, BR - 15, 0, P, 120), { tone: "lo" }));
  const dial = k.radialTicks(BX, BY, BR - 6.4, 72, 6, 0, [2, 3.8], P);
  back.push(Ln(dial.minor, { tone: "lo" }), Ln(dial.major, { tone: "mid" }));
  const screws = Array.from({ length: 4 }, (_, i) => [BX + (BR - 24) * Math.cos((i * 90 + 45) * DEG), BY + (BR - 24) * Math.sin((i * 90 + 45) * DEG)]);
  back.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  back.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const LABEL = { x: BX + BR - 40, y: -24, w: 16, d: 48, r: 1.6 };
  back.push(S(k.slabOf(LABEL, 0, 0.9, P, 4), { tone: "lo", crease: "none" }));
  back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.9, P, 4), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 9.6, LABEL.y + LABEL.d / 2], 0.9, P, "y"), "TORSO · ENARM", { size: 3.4, tone: "mid", anchor: "middle" }));
  back.push(Ln([0, 1].map((i) => k.lineOnTop([LABEL.x + 4.2 + i * 1.7, LABEL.y + 8], [LABEL.x + 4.2 + i * 1.7, LABEL.y + LABEL.d - 8 - i * 12], 0.9, P)).join(""), { tone: "lo", free: true }));
  back.push(Dots([at([LABEL.x + LABEL.w / 2, LABEL.y + 3, 0.9]), at([LABEL.x + LABEL.w / 2, LABEL.y + LABEL.d - 3, 0.9])], { size: 0.45 }));
  R.solid(A.cylinder(BX, BY, BR, -BASE_H, BASE_H, { name: "stand.base", ground: true }));

  // ---------- Pedestal with a seat cup ----------
  const PED = G.frameOf([-8, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  turned("soporte", PED, [[0, 30], [3.2, 30], [3.2, 26], [5, 23, 1], [8, 19, 1], [12, 16.5, 1], [16, 15.5]], { name: "stand.pedestal-foot" });
  turned("soporte", PED, [[16, 13], [33, 13]], { name: "stand.pedestal-column", inner: Ln([21, 28].map((s) => G.arcOf(PED, s, 13, P)).join(""), { tone: "faint" }) });
  turned("soporte", PED, [[33, 16], [35, 24, 1], [37, 30, 1], [SEAT_Z - 2, 36], [SEAT_Z, 36]], { name: "stand.pedestal-cup" });
  put("soporte", [-8, 0, SEAT_Z], Ln(k.ring(-8, 0, 32, SEAT_Z, P, 72), { tone: "lo" }) + Dots(G.dotsOf(PED, SEAT_Z, 34, 16, P, { fade: [0.04, 0.42] }), { size: 0.42 }), { bias: 0.2, name: "stand.cup-ring" });

  // ---------- Support rod behind the spine ----------
  const ROD = [-66, 0];
  cyl("soporte", ROD[0], ROD[1], 6, SEAT_Z, 3, { name: "stand.rod-collar" });
  cyl("soporte", ROD[0], ROD[1], 2.6, SEAT_Z + 3, NECK_Z - SEAT_Z - 3, { crease: "none", name: "stand.rod", extra: Ln(k.sideArc(ROD[0], ROD[1], 2.6, 90, P, 12) + k.sideArc(ROD[0], ROD[1], 2.6, 200, P, 12), { tone: "faint" }) });
  slab("soporte", { x: -60, y: -5, w: 26, d: 10, r: 2 }, SEAT_Z - 3, 3, { name: "stand.rod-foot" });
  for (const level of ["L3", "T11", "T6", "T1"]) {
    const z = levelZ(level);
    const x0 = spineX(z) - LEVELS[level].r - (LEVELS[level].lumbar ? 15 : 17);
    cyl("soporte", ROD[0], ROD[1], 4.2, z - 3, 6, { name: `stand.clamp-${level}`, extra: Ln(k.knurl(ROD[0], ROD[1], 4.2, z - 3, z + 3, 22, P), { tone: "lo" }) });
    slab("soporte", { x: ROD[0] + 3.5, y: -1.6, w: x0 - ROD[0] - 3.5, d: 3.2, r: 1 }, z - 1.4, 2.8, { name: `stand.arm-${level}`, extra: Dots([at([ROD[0] + 7, 0, z + 1.4])], { size: 0.4 }) });
  }

  // ---------- Pelvis ----------
  const RING_C = [0, 0, 64];
  const tilt = 34 * DEG;
  const ex = [Math.cos(tilt), 0, -Math.sin(tilt)];
  const ringAt = (t) => G.add3(RING_C, G.add3(G.mul3(ex, 31 * Math.cos(t) + 4), [0, 37 * Math.sin(t), 0]));
  tube("pelvis", Array.from({ length: 49 }, (_, i) => ringAt((i / 48) * Math.PI * 2)), 3.8, { tone: "mid", name: "pelvis.ring", maxLength: 10, smooth: false, caps: false });
  const SAC = G.frameOf([-30, 0, 62], G.unit3([1, 0, 0.32]), [0, 1, 0], G.unit3([-0.32, 0, 1]));
  prism("pelvis", SAC, [[-17, 13], [17, 13], [11, -8], [4, -19], [-4, -19], [-11, -8]], -5, 4, { name: "pelvis.sacrum", extra: Dots([[-7, 6], [7, 6], [-5, -4], [5, -4]].map(([u, v]) => at(G.add3(G.add3(SAC.o, G.mul3(SAC.u, u)), G.add3(G.mul3(SAC.v, v), G.mul3(SAC.a, 4))))), { size: 0.7, tone: "lo" }) });
  for (const side of [1, -1]) {
    const crest = [[-31, side * 14, 72], [-28, side * 32, 88], [-12, side * 50, 96], [8, side * 54, 92], [19, side * 48.5, 85.5]];
    tube("pelvis", crest, 3.2, { tone: "mid", name: `pelvis.crest-${side > 0 ? "r" : "l"}`, bend: 4, maxLength: 9 });
    ball("pelvis", [20.5, side * 47.8, 84.6], 4.4, { tone: "mid", name: `pelvis.asis-${side > 0 ? "r" : "l"}` });
  }
  note("pelvis", [0, 0, 64]);

  // ---------- Vertebral column ----------
  for (const [name, L] of Object.entries(LEVELS)) {
    const zc = (L.z0 + L.z1) / 2;
    const x = spineX(zc);
    const h = L.z1 - L.z0;
    cyl("columna", x, 0, L.r, L.z0, h, { steps: 32, name: `columna.${name}`, extra: Ln(k.sideArc(x, 0, L.r, L.z0 + h * 0.5, P, 24), { tone: "faint" }) });
    if (name !== "C7") {
      const dz = L.lumbar ? 4.5 : 2.8;
      cyl("columna", spineX(L.z1), 0, L.r - 0.9, L.z1, dz, { tone: "lo", steps: 32, name: `columna.disc-${name}` });
    }
    const arch = { x: x - L.r - 7, y: -L.r * 0.62, w: 7.4, d: L.r * 1.24, r: 1.6 };
    slab("columna", arch, L.z0 + 1, h - 2, { name: `columna.arch-${name}` });
    const spinous = L.lumbar ? { x: arch.x - 13, y: -1.8, w: 13.4, d: 3.6, r: 1.4 } : { x: arch.x - 15, y: -1.4, w: 15.4, d: 2.8, r: 1.2 };
    slab("columna", spinous, L.lumbar ? L.z0 + 2 : L.z0 - 3, L.lumbar ? h - 4 : h - 2, { name: `columna.spinous-${name}` });
    const reach = L.lumbar ? L.r + 9 : L.r + 6;
    slab("columna", { x: arch.x + 1.2, y: -reach, w: 4.4, d: reach * 2, r: 1.6 }, L.z0 + h * 0.3, h * 0.42, { name: `columna.transverse-${name}` });
  }
  note("columna", [spineX(200), 0, 200]);

  // ---------- Neck section plate at C7 ----------
  const NECK = { x: -44, y: -30, w: 64, d: 60, r: 22 };
  const top = NECK_Z + NECK_H;
  const engraving = [
    Ln(k.ring(spineX(334), 0, 6.6, top, P, 32), { tone: "mid" }),
    Ln(k.ring(spineX(334) - 9, 0, 3.2, top, P, 20), { tone: "lo" }),
    Ln(k.ring(-3, 0, 6.2, top, P, 28) + k.ring(-3, 0, 4.4, top, P, 24), { tone: "mid" }),
    Ln(k.ring(-15, 1, 4.5, top, P, 24), { tone: "lo" }),
    Ln(k.ring(4, 12, 3.4, top, P, 18) + k.ring(2, -10, 2.7, top, P, 18) + k.ring(-10, -22, 2.9, top, P, 18), { tone: "red" }),
    Ln(k.ring(8, 22, 3.8, top, P, 18) + k.ring(1, -24, 3.6, top, P, 18), { tone: "blue" }),
    Ln(k.planOutline(k.insetPlan(NECK, 2.4), top, P, 8), { tone: "faint" }),
  ].join("");
  slab("cuello", NECK, NECK_Z, NECK_H, { tone: "mid", steps: 8, bevel: 0.6, name: "cuello.plate", extra: engraving + Dots(k.corners(NECK, 7).map(([x, y]) => at([x, y, top])), { size: 0.45 }) });
  slab("soporte", { x: ROD[0] + 2, y: -3, w: NECK.x - ROD[0] - 1.5, d: 6, r: 1.4 }, NECK_Z + 1, 3, { name: "stand.neck-arm" });
  note("cuello", [-10, 0, top]);

  const T = thorax($, note);
  const M = mediastinum($, T, note);
  const B = abdomen($, T, M, note);
  return { R, back, $, anchors };
}

// ---------- Thorax: diaphragm, lungs, ribs, heart ----------
function thorax($, note) {
  const { R, at, S, Ln, put, organ, turned, tube, surfaceCurve, slopeOf } = $;
  const P = R.P;
  const out = {};

  for (const [side, d] of Object.entries(DOMES)) {
    const F = G.frameOf([d.c[0], d.c[1], d.rim], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    const H = d.apex - d.rim;
    const outer = (s) => d.R * Math.sqrt(Math.max(0, 1 - (s / H) ** 2));
    const shell = [[0, 0]];
    for (let i = 0; i <= 24; i++) {
      const s = H * (1 - Math.cos((i / 24) * (Math.PI / 2)));
      shell.push([s, i === 24 ? 0 : outer(s), i > 0 && i < 24 ? 1 : 0]);
    }
    const paths = G.lathe(shell.map(([s, r, f]) => (f ? [s, r, 1] : [s, r])), F, P, { smooth: true });
    const sT = H * 0.38;
    const tendon = Ln(G.arcOf(F, sT, outer(sT), P, { slope: (-d.R * sT) / (H * H * Math.sqrt(1 - (sT / H) ** 2)) }), { tone: "faint" });
    put("diafragma", [d.c[0], d.c[1], d.rim + H * 0.3], S(paths, { tone: "hi", inner: tendon }), { name: `diafragma.cupula-${side}`, shapes: [A.lathe(F, shell.map(([s, r]) => [s, r]))] });
  }
  const TENDON = G.frameOf([12, -4, 217], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  turned("diafragma", TENDON, [[0, 20], [1.4, 20.6, 1], [2.6, 20]], { tone: "hi", name: "diafragma.tendon" });
  note("diafragma", [8, -4, 218]);

  out.lungs = {};
  for (const [side, L] of Object.entries(LUNGS)) {
    const d = L.dome;
    const piece = side === "r" ? "pulmon-der" : "pulmon-izq";
    const F = G.frameOf([d.c[0], d.c[1], L.rim], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    const top = L.apex - L.rim;
    const dish = [];
    for (let i = 0; i <= 14; i++) {
      const rho = (L.Rb * i) / 14;
      dish.push([domeZ(d, rho) + 0.8 - L.rim, rho]);
    }
    const wall = [];
    for (let i = 1; i <= 32; i++) {
      const t = i / 32;
      wall.push([t * top, i === 32 ? 0 : lungR(L, L.rim + t * top), i < 32 ? 1 : 0]);
    }
    const meridian = [...dish, ...wall];
    const paths = G.lathe(meridian, F, P, { smooth: true });
    const radius = (s) => lungR(L, L.rim + s);
    const obliqueN = G.unit3([63, 0, 68]);
    const oblique0 = [-40, 0, side === "r" ? 284 : 288];
    const obl = (p) => G.dot3(G.sub3(p, oblique0), obliqueN);
    const cutS = (angle) => {
      let lo = 1, hi = top - 1;
      const f = (s) => obl(G.pointOf(F, s, radius(s), angle));
      if (f(lo) * f(hi) > 0) return null;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (f(lo) * f(mid) <= 0) hi = mid;
        else lo = mid;
      }
      return (lo + hi) / 2;
    };
    const samples = [];
    for (let i = 0; i <= 240; i++) {
      const angle = (i / 240) * Math.PI * 2;
      const s = cutS(angle);
      if (s !== null) samples.push([s, angle]);
    }
    let lines = surfaceCurve(F, radius, samples);
    if (side === "r") {
      const zH = 266 - L.rim;
      const hs = [];
      for (let i = 0; i <= 240; i++) {
        const angle = (i / 240) * Math.PI * 2;
        if (obl(G.pointOf(F, zH, radius(zH), angle)) > 0) hs.push([zH, angle]);
      }
      lines += surfaceCurve(F, radius, hs);
    }
    put(piece, [d.c[0], d.c[1], L.rim + top * 0.38], S(paths, { tone: "hi", inner: Ln(lines, { tone: "mid" }) }), { name: `${piece}.organ`, shapes: [A.lathe(F, meridian.map(([s, r]) => [s, r]))] });
    out.lungs[side] = { F, radius, L, top };
    note(piece, [d.c[0] + 10, d.c[1], L.rim + top * 0.4]);
  }

  // Ribs, anterior chest wall removed.
  for (const sign of [1, -1]) {
    const L = sign > 0 ? LUNGS.r : LUNGS.l;
    THORACIC.slice().reverse().forEach((name, index) => {
      const n = index + 1;
      const lev = LEVELS[name];
      const z0 = lev.z0 + (lev.z1 - lev.z0) * 0.7;
      const x0 = spineX(z0);
      const c = L.dome.c;
      const drop = n === 1 ? 10 : n <= 7 ? 34 : 24;
      const end = n === 1 ? 24 : n <= 10 ? 48 + n * 1.6 : n === 11 ? 112 : 142;
      const start = 204;
      const pts = [[x0 - lev.r - 4, sign * (lev.r + 4.5), z0]];
      const steps = 22;
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        const phi = (start + (end - start) * f) * DEG;
        const z = z0 - 2 - drop * Math.pow(f, 1.4);
        const below = z < L.rim + 4;
        const rr = n === 1 ? lungR(L, z) + 5.4 : (below ? L.Rb + 5 : lungR(L, z)) + 6.6;
        pts.push([c[0] + rr * Math.cos(phi), sign * (Math.abs(c[1]) + rr * Math.sin(phi)), z]);
      }
      tube("costillas", pts, n === 1 ? 2 : 2.1, { tone: "mid", name: `costillas.${sign > 0 ? "d" : "i"}${n}`, maxLength: 11, smooth: false });
    });
  }
  note("costillas", [-10, 70, 250]);

  // Heart.
  const HF = G.frameAlong(G.sub3(HEART.c, G.mul3(HEART.a, HEART.back)), HEART.a);
  const hr = egg(HEART.R, HEART.L, 0.42);
  const avS = 15;
  const groove = G.arcOf(HF, avS, hr(avS), P, { slope: slopeOf(hr)(avS) });
  const ivAngle = G.angleToward(HF, [1, 0.3, 0.35]);
  const ivPts = [];
  for (let i = 0; i < 48; i++) {
    const s = avS + ((HEART.L - 2.5 - avS) * i) / 47;
    if (G.facingOf(HF, ivAngle, P, slopeOf(hr)(s)) > 0.02) ivPts.push(at(G.pointOf(HF, s, hr(s), ivAngle)));
  }
  const lad = ivPts.length > 1 ? k.fadeLineSvg(ivPts, { fade: [0, 10], tone: "red" }) : "";
  out.heart = organ("corazon", HF, hr, HEART.L, { name: "corazon.organ", inner: Ln(groove, { tone: "red" }) + lad });
  out.heart.centre = HEART.c;
  note("corazon", HEART.c);
  return out;
}

// ---------- Mediastinum: great vessels, airway, oesophagus ----------
function mediastinum($, T, note) {
  const { R, at, S, Ln, put, ball, tube, surfaceAt, slopeOf } = $;
  const P = R.P;
  const out = {};
  const H = T.heart;
  const onHeart = (s, dir, inset = 1.6) => {
    const p = surfaceAt(H.F, H.radius, s, dir);
    const axisPoint = G.pointOf(H.F, s, 0, 0);
    return G.add3(p, G.mul3(G.unit3(G.sub3(axisPoint, p)), inset));
  };
  const onLung = (side, z, dir, inset = 1.2) => {
    const lung = T.lungs[side];
    const s = z - lung.L.rim;
    const p = surfaceAt(lung.F, lung.radius, s, dir);
    const c = G.pointOf(lung.F, s, 0, 0);
    return G.add3(p, G.mul3(G.unit3(G.sub3(c, p)), inset));
  };
  const nz = NECK_Z - 0.2;

  // Aorta: ascending, arch, descending thoracic and abdominal, to its bifurcation at L4.
  const a0 = onHeart(5, [0.2, 0.35, 1], 2.5);
  const aortaPts = [a0, G.add3(a0, [1, -0.5, 8]), [10, 2, 288], [9, -6, 299], [2, -13.5, 303], [-10, -16, 299], [-19, -14, 286], [-20, -13, 268], [-19, -11, 240], [-17, -8, 205], [-13, -5, 176], [-10, -4, 150], [-9, -4, 120], [-9, -4, 104]];
  out.aorta = tube("aorta", aortaPts, ramp([[0, 7], [0.25, 6.5], [0.5, 6], [1, 5.3]]), { tone: "red", name: "aorta.trunk", maxLength: 10, bend: 2.4 });
  ball("aorta", [-9, -4, 101], 6.2, { tone: "red", name: "aorta.bifurcation" });
  for (const side of [1, -1]) tube("aorta", [[-9, -4 + side * 3, 99], [-4, side * 14, 90], [5, side * 25, 74], [12, side * 30.5, 60.5]], 3.5, { tone: "red", name: `aorta.iliac-${side > 0 ? "r" : "l"}`, maxLength: 9 });
  tube("aorta", [[7, -4, 300], [8, 4, 314], [5, 10, nz]], 3.4, { tone: "red", name: "aorta.brachiocephalic", maxLength: 9 });
  tube("aorta", [[1, -12, 305], [2, -10, nz]], 2.7, { tone: "red", name: "aorta.carotid-l", maxLength: 9, smooth: false });
  tube("aorta", [[-8, -18, 301], [-9, -21, 318], [-10, -22, nz]], 2.9, { tone: "red", name: "aorta.subclavian-l", maxLength: 9 });
  note("aorta", [-17, -8, 205]);

  // Venae cavae.
  const svcEnd = onHeart(4, [-0.1, 1, 0.45], 2);
  ball("cavas", [8, 20, 312], 5.2, { tone: "blue", name: "cavas.svc-confluence" });
  tube("cavas", [[8, 20, 309], [8, 19, 292], G.add3(svcEnd, [0, 0, 6]), svcEnd], 4.8, { tone: "blue", name: "cavas.svc", maxLength: 9 });
  tube("cavas", [[8, 21, 315], [7, 22, nz]], 3.6, { tone: "blue", name: "cavas.brachiocephalic-r", maxLength: 9, smooth: false });
  tube("cavas", [[1, -24, nz], [4, -22, 330], [14, -14, 324], [15, 6, 318], [11, 17, 314]], 3.4, { tone: "blue", name: "cavas.brachiocephalic-l", maxLength: 9 });
  const ivcEnd = onHeart(13, [-0.35, 1, -0.75], 2);
  ball("cavas", [-9, 10, 92], 5.6, { tone: "blue", name: "cavas.ivc-confluence" });
  out.ivc = tube("cavas", [[-9, 10, 95], [-9, 12, 112], [-9, 13, 150], [-8, 14, 185], [-4, 14, 214], G.add3(ivcEnd, [-4, 0, -8]), ivcEnd], 6.1, { tone: "blue", name: "cavas.ivc", maxLength: 10 });
  for (const side of [1, -1]) tube("cavas", [[-11, 10 + side * 3, 89], [-6, side * 18, 82], [3, side * 27, 70], [9.5, side * 31.5, 60]], 3.8, { tone: "blue", name: `cavas.iliac-${side > 0 ? "r" : "l"}`, maxLength: 9 });
  note("cavas", [-8, 14, 160]);

  // Pulmonary trunk and arteries.
  const pt0 = onHeart(10, [0.85, -0.55, 0.55], 2.2);
  tube("corazon", [pt0, G.add3(pt0, [2, -1, 7]), [12, -10, 278], [7, -8, 283]], 6.2, { tone: "blue", name: "corazon.pulmonary-trunk", maxLength: 9 });
  ball("corazon", [6, -8, 284], 6.6, { tone: "blue", name: "corazon.pulmonary-bifurcation" });
  tube("corazon", [[2, -6, 283], [-2, 6, 279], [-4, 18, 277], onLung("r", 276, [0.2, -1, 0])], 4.5, { tone: "blue", name: "corazon.pulmonary-r", maxLength: 9 });
  tube("corazon", [[3, -13, 285], [0, -24, 283], onLung("l", 281, [0.3, 1, 0])], 4.3, { tone: "blue", name: "corazon.pulmonary-l", maxLength: 9 });

  // Trachea and main bronchi.
  tube("traquea", [[-3, 0, nz], [-3, 0, 289]], 6.2, { tone: "hi", name: "traquea.trachea", maxLength: 10, smooth: false, rings: { pitch: 4.2, fade: [0.08, 0.5] } });
  ball("traquea", [-3, 0, 284.5], 7, { tone: "hi", name: "traquea.carina" });
  tube("traquea", [[-4, 4, 281], [-5, 16, 273], onLung("r", 271, [0, -1, 0])], 4.7, { tone: "hi", name: "traquea.bronchus-r", maxLength: 9, rings: { pitch: 3.6, fade: [0.08, 0.5] } });
  tube("traquea", [[-4, -5, 282], [-6, -18, 279], onLung("l", 278, [0.1, 1, 0])], 4.1, { tone: "hi", name: "traquea.bronchus-l", maxLength: 9, rings: { pitch: 3.6, fade: [0.08, 0.5] } });
  note("traquea", [-3, 0, 300]);

  out.lungs = T.lungs;
  return out;
}

// ---------- Abdomen ----------
function abdomen($, T, M, note) {
  const { R, at, S, Ln, put, organ, ball, turned, tube, surfaceAt, slopeOf } = $;
  const P = R.P;
  const out = {};
  const inset = (F, radius, s, dir, by = 1.4) => {
    const p = surfaceAt(F, radius, s, dir);
    const c = G.pointOf(F, s, 0, 0);
    return G.add3(p, G.mul3(G.unit3(G.sub3(c, p)), by));
  };
  const onBall = (c, r, dir, by = 1.2) => G.add3(c, G.mul3(G.unit3(dir), r - by));

  // Liver: thick right lobe tapering to the left lobe.
  const LIV_A = G.unit3([0.04, -1, 0.16]);
  const LF = G.frameAlong([0, 66, 192], LIV_A);
  const lr = egg(29, 112, 0.74, 1.15);
  const lig = [];
  const sLig = 66 - 6;
  const falci = G.arcOf(LF, sLig, lr(sLig), P, { slope: slopeOf(lr)(sLig) });
  out.liver = organ("higado", LF, lr, 114, { name: "higado.organ", inner: Ln(falci, { tone: "mid" }) });
  note("higado", [14, 34, 196]);

  // Gallbladder under the liver, fundus forward.
  const GBF = G.frameAlong([16, 28, 176], G.unit3([0.7, 0.15, -0.7]));
  const gr = egg(7.6, 24, -0.6);
  organ("vesicula", GBF, gr, 24, { name: "vesicula.organ" });
  note("vesicula", [26, 30, 166]);

  // Stomach: fundus, body, antrum and pylorus as one tapering tube.
  const FUNDUS = [-4, -38, 208];
  ball("estomago", FUNDUS, 16, { name: "estomago.fundus" });
  const stomachPts = [FUNDUS, [4, -42, 192], [12, -38, 175], [16, -28, 160], [16, -14, 156], [12, -1, 160], [8.6, 7.6, 163.6]];
  tube("estomago", stomachPts, ramp([[0, 16], [0.25, 15], [0.45, 13.5], [0.65, 10.5], [0.85, 7], [1, 4.8]]), { tone: "hi", name: "estomago.body", maxLength: 10, bend: 1.4 });
  const PYL = [8, 9, 164];
  const pylAxis = G.unit3([-0.35, 1, 0.05]);
  const PF = G.frameAlong(PYL, pylAxis);
  put("estomago", PYL, S(G.disc(-1.2, 1.2, 6, PF, P), { tone: "mid" }), { name: "estomago.pylorus", shapes: [A.disc(PF, -1.2, 1.2, 6)] });
  note("estomago", [12, -36, 182]);

  // Oesophagus: behind the trachea and the heart, through the hiatus at T10, into the cardia.
  const cardia = onBall(FUNDUS, 16, [0.15, 0.8, 0.55], 1.4);
  tube("esofago", [[-15, 1, NECK_Z - 0.2], [-15, 1, 292], [-14, -2, 262], [-11, -6, 238], [-7, -11, 222], G.add3(cardia, [-1, 5, 5]), cardia], 4.4, { tone: "hi", name: "esofago.tube", maxLength: 10, bend: 2.6 });
  note("esofago", [-14, -2, 262]);

  // Duodenum: the C-loop round the head of the pancreas.
  tube("duodeno", [[8.4, 10.2, 164], [4, 19, 165], [3, 25, 152], [3, 25, 137], [3, 12, 129], [2, -8, 129], [-1, -16, 137], [0, -19, 146]], 4.4, { tone: "hi", name: "duodeno.loop", maxLength: 9, bend: 2.2 });
  note("duodeno", [3, 22, 140]);

  // Pancreas: head in the C, neck over the vessels, tail to the spleen.
  ball("pancreas", [6, 12, 147], 7.6, { name: "pancreas.head" });
  tube("pancreas", [[6, 12, 147], [7, 2, 155], [2, -12, 160], [-8, -30, 166], [-18, -51, 174]], ramp([[0, 7.6], [0.25, 5.8], [0.55, 5], [1, 3.6]]), { tone: "hi", name: "pancreas.body", maxLength: 9 });
  note("pancreas", [2, -10, 160]);

  // Spleen, behind the stomach under the left dome.
  const SPA = G.unit3([0.55, 0.15, -0.82]);
  const SPF = G.frameAlong(G.sub3([-24, -64, 176], G.mul3(SPA, 25)), SPA);
  const spr = egg(13, 50, 0.05);
  organ("bazo", SPF, spr, 50, { name: "bazo.organ" });
  note("bazo", [-24, -64, 176]);

  // Kidneys, ureters and adrenals.
  const kidneys = {};
  for (const side of [1, -1]) {
    const c = [-28, side * 38, side > 0 ? 144 : 151];
    const axis = G.unit3([-0.12, -side * 0.22, 1]);
    const KF = G.frameAlong(G.sub3(c, G.mul3(axis, 27)), axis);
    const kr = egg(14, 54, 0);
    organ("rinones", KF, kr, 54, { name: `rinones.${side > 0 ? "r" : "l"}` });
    const pole = G.add3(c, G.mul3(axis, 25.5));
    const AF = G.frameAlong(pole, axis);
    turned("rinones", AF, [[0, 6.4], [3, 5, 1], [8.5, 0.6]], { tone: "hi", name: `rinones.adrenal-${side > 0 ? "r" : "l"}` });
    kidneys[side] = { KF, kr, c };
    const hilum = inset(KF, kr, 22, [0.4, -side, 0], 1.5);
    tube("rinones", [hilum, G.add3(hilum, [3, -side * 4, -8]), [-14, side * 22, 112], [-3, side * 20, 88], [3, side * 13, 72], onBall([8, 0, 64], 14, [-0.45, side * 0.85, 0.3])], 1.4, { tone: "hi", name: `rinones.ureter-${side > 0 ? "r" : "l"}`, maxLength: 10, bend: 5 });
  }
  note("rinones", [-28, 38, 150]);

  // Renal vessels, celiac trunk, mesenteric arteries.
  const hilumOf = (side, by = 1.2, s = 28) => inset(kidneys[side].KF, kidneys[side].kr, s, [0.3, -side, 0.05], by);
  tube("aorta", [[-11, -1, 152], [-17, 6, 151], [-22, 18, 149], hilumOf(1, 1.2, 29)], 2.2, { tone: "red", name: "aorta.renal-r", maxLength: 9 });
  tube("aorta", [[-11, -8, 154], [-16, -20, 155], hilumOf(-1, 1.2, 29)], 2.2, { tone: "red", name: "aorta.renal-l", maxLength: 9 });
  tube("cavas", [hilumOf(-1, 1.2, 33), [-12, -20, 159], [-3, -8, 159], [-4, 4, 159], [-8, 8, 158]], 2.6, { tone: "blue", name: "cavas.renal-l", maxLength: 9 });
  tube("cavas", [hilumOf(1, 1.2, 33), [-16, 18, 156], [-11, 13, 155]], 2.6, { tone: "blue", name: "cavas.renal-r", maxLength: 9 });
  ball("aorta", [0, -4, 178], 3, { tone: "red", name: "aorta.celiac" });
  tube("aorta", [[-10, -4, 177], [-2.5, -4, 178]], 2.4, { tone: "red", name: "aorta.celiac-trunk", smooth: false, maxLength: 9 });
  tube("aorta", [[1.5, -2, 177.6], [5, 8, 176], [9, 18, 174]], 1.8, { tone: "red", name: "aorta.hepatic", maxLength: 9 });
  tube("aorta", [[-1, -6.5, 177], [-6, -16, 175], [-12, -32, 175], [-20, -52, 178]], 1.8, { tone: "red", name: "aorta.splenic", maxLength: 9 });
  tube("aorta", [[0.5, -5.5, 180.5], [3, -14, 188], onBall([4, -42, 192], 15, [0, 1, -0.1], 1)], 1.6, { tone: "red", name: "aorta.gastric-l", maxLength: 9 });
  tube("aorta", [[-7, -4, 167], [-1, -4, 162], [3, -3, 147], [9.5, -2, 136], [13, -2, 129]], 2.4, { tone: "red", name: "aorta.sma", maxLength: 9 });
  tube("aorta", [[-7, -7, 124], [-5, -18, 117], [-1, -40, 108], [-0.5, -47, 106]], 1.8, { tone: "red", name: "aorta.ima", maxLength: 9 });

  // Small intestine: loops across the lower abdomen, ending in the caecum.
  const CAECUM = [12, 40, 92];
  const rows = [128, 118, 108, 98];
  const smallPts = [[0, -19, 146.5], [6, -24, 138], [14, -30, 129]];
  rows.forEach((z, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const from = dir > 0 ? -30 : 26;
    const to = dir > 0 ? 26 : -30;
    for (let j = 0; j <= 6; j++) {
      const y = from + ((to - from) * j) / 6;
      smallPts.push([16 + 3.2 * Math.sin(y * 0.13 + i * 1.7), y, z + 1.2 * Math.sin(y * 0.2 + i)]);
    }
    const next = rows[i + 1] ?? 90;
    smallPts.push([16, to + dir * 5.5, (z + next) / 2]);
  });
  smallPts.push([16, -24, 90], [14, 4, 90.5], [12.5, 24, 91.5], onBall(CAECUM, 8.6, [0, -1, 0], 1.4));
  tube("intestino", smallPts, 3.6, { tone: "hi", name: "intestino.loops", maxLength: 10, bend: 1.6 });
  note("intestino", [16, -4, 110]);

  // Large intestine: caecum to rectum, with haustra; appendix.
  ball("colon", CAECUM, 8.6, { name: "colon.caecum" });
  const colonPts = [CAECUM, [8, 44, 104], [4, 46, 150], [10, 40, 162], [24, 28, 150], [30, 10, 140], [30, -12, 140], [24, -34, 152], [2, -56, 170], [-2, -55, 156], [-1, -54, 104], [6, -46, 90], [16, -28, 86], [10, -12, 82], [-6, -4, 78], [-16, -1, 64], [-17, 0, 50], [-17, 0, SEAT_Z + 1.2]];
  tube("colon", colonPts, ramp([[0, 7.6], [0.08, 6.8], [0.7, 6.4], [0.82, 5.4], [0.92, 6.2], [1, 6]]), { tone: "hi", name: "colon.frame", maxLength: 10, bend: 1.8, rings: { pitch: 5.2, fade: [0.1, 0.55] } });
  tube("colon", [onBall(CAECUM, 8.6, [0.1, -0.35, -1], 1.2), [13, 36, 74], [15, 31, 66]], 1.6, { tone: "hi", name: "colon.appendix", maxLength: 8, bend: 3 });
  ball("colon", [15.3, 30.4, 65], 1.9, { name: "colon.appendix-tip" });
  note("colon", [30, -2, 140]);

  // Bladder in the pelvis.
  const BF = G.frameOf([8, 0, 50], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const bl = egg(14.2, 28, 0.05);
  organ("vejiga", BF, bl, 28, { name: "vejiga.organ" });
  note("vejiga", [8, 0, 64]);
  return out;
}
