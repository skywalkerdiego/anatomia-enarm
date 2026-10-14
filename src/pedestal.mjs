// The stand the body turns on, drawn with the anatomy kit: a plinth on feet, a drum, a turntable
// with a degree ring, and a height rod whose cursor reads the level of whatever is selected.
// World units are millimetres; the body stands on z = 0 over the origin.
import * as k from "../vendor/anatomy-kit/kit/iso-kit.mjs";

export const AZIMUTH = 45;
export const ELEVATION = 16;
export const W = 420;
export const H = 700;
const DEG = Math.PI / 180;

const PLINTH = { x: -350, y: -350, w: 700, d: 700, r: 72 };
const PLINTH_Z = -72;
const PLINTH_H = 30;
const DRUM_R = 300;
const DRUM_Z = -42;
const DRUM_H = 28;
const TABLE_R = 272;
const TABLE_H = 14;
export const ROD = [-292, 292];
const ROD_R = 9;
export const ROD_TOP = 1790;
export const CURSOR_REST = 900;

export function projection() {
  const pts = [];
  for (const [x, y] of k.corners(PLINTH, 0)) pts.push([x, y, PLINTH_Z - 14]);
  pts.push([ROD[0], ROD[1], ROD_TOP + 24], [0, 0, 1680], [340, -340, 800], [-340, 340, 800], [340, 340, -60]);
  return k.fitProjection(pts, W, H, { pad: 10, azimuth: AZIMUTH, elevation: ELEVATION });
}

export function pedestal(P) {
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const Dots = (points, style) => k.dotsSvg(points, style);
  const at = (p) => k.iso(p, P);
  const out = [];

  // Shadow on the floor, then the feet from the far side to the near side.
  out.push(`<path class="iso-halo" d="${k.haloOf(PLINTH, PLINTH_Z - 12, PLINTH_H, P)}"/>`);
  const feet = [[-262, -262], [262, -262], [-262, 262], [262, 262]].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of feet) {
    out.push(S(k.cylinder(x, y, 44, PLINTH_Z - 12, 4, P, 32), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 34, PLINTH_Z - 8, 8, P, 32), { tone: "mid" }));
  }

  // Plinth with a groove, corner screws and the label plate.
  const top = PLINTH_Z + PLINTH_H;
  out.push(S(k.slabOf(PLINTH, PLINTH_Z, PLINTH_H, P, 10, 3), { tone: "mid" }));
  out.push(Ln(k.planOutline(k.insetPlan(PLINTH, 16), top, P, 10), { tone: "faint" }));
  const screws = k.corners(PLINTH, 40);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 9, top, P, 18)).join(""), { tone: "lo" }));
  out.push(Dots(screws.map(([x, y]) => at([x, y, top])), { size: 0.5 }));
  const LABEL = { x: 60, y: 304, w: 150, d: 32, r: 5 };
  out.push(S(k.slabOf(LABEL, top, 2.4, P, 4), { tone: "lo", crease: "none" }));
  out.push(Ln(k.planOutline(k.insetPlan(LABEL, 4), top + 2.4, P, 4), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([LABEL.x + LABEL.w / 2, LABEL.y + 21], top + 2.4, P, "x"), "CUERPO · ENARM", { size: 11.5, tone: "mid", anchor: "middle" }));
  out.push(Dots([at([LABEL.x + 8, LABEL.y + LABEL.d / 2, top + 2.4]), at([LABEL.x + LABEL.w - 8, LABEL.y + LABEL.d / 2, top + 2.4])], { size: 0.42 }));

  // Height rod at the left corner: collar, rod with a ring every 100 mm, cap.
  const [rx, ry] = ROD;
  const rod = [];
  rod.push(S(k.cylinder(rx, ry, 30, top, 10, P, 28, 1.5), { tone: "mid" }));
  rod.push(S(k.cylinder(rx, ry, 17, top + 10, 26, P, 24), { tone: "mid", inner: Ln(k.knurl(rx, ry, 17, top + 10, top + 36, 20, P), { tone: "lo" }) }));
  let rings = "", majors = "";
  for (let z = 100; z <= 1700; z += 100) (z % 500 === 0 ? (majors += k.sideArc(rx, ry, ROD_R, z, P, 12)) : (rings += k.sideArc(rx, ry, ROD_R, z, P, 12)));
  rod.push(S(k.cylinder(rx, ry, ROD_R, top + 36, ROD_TOP - top - 36, P, 20), { tone: "mid", crease: "none", inner: Ln(rings, { tone: "lo" }) + Ln(majors, { tone: "hi" }) }));
  rod.push(S(k.cylinder(rx, ry, 15, ROD_TOP, 14, P, 24, 3), { tone: "mid" }));
  out.push(`<g class="ped-rod">${rod.join("")}</g>`);

  // The cursor that slides on the rod, with its pointer towards the body.
  const cz = CURSOR_REST;
  const cursor = [
    S(k.cylinder(rx, ry, 19, cz - 20, 40, P, 24, 1.5), { tone: "hi", inner: Ln(k.knurl(rx, ry, 19, cz - 18.5, cz + 18.5, 22, P), { tone: "lo" }) }),
    S(k.slabOf({ x: rx + 16, y: ry - 7, w: 64, d: 14, r: 5 }, cz - 5, 10, P, 4, 1), { tone: "hi", lit: true }),
    Dots([at([rx + 70, ry, cz + 5])], { size: 0.5 }),
  ];
  out.push(`<g class="ped-cursor" data-rest="${cz}">${cursor.join("")}</g>`);

  // Drum and turntable with its degree ring.
  out.push(S(k.cylinder(0, 0, DRUM_R, DRUM_Z, DRUM_H, P, 120, 2.4), { tone: "mid", inner: Ln(k.sideArc(0, 0, DRUM_R, DRUM_Z + 9, P, 96) + k.sideArc(0, 0, DRUM_R, DRUM_Z + 19, P, 96), { tone: "faint" }) }));
  out.push(Ln(k.ring(0, 0, DRUM_R - 9, DRUM_Z + DRUM_H, P, 120), { tone: "faint" }));
  out.push(S(k.cylinder(0, 0, TABLE_R, -TABLE_H, TABLE_H, P, 120, 1.6), { tone: "mid", inner: Ln(k.knurl(0, 0, TABLE_R, -TABLE_H, -1.6, 150, P), { tone: "faint" }) }));
  // The ticks hang from this ring, so each one ends on a line.
  out.push(Ln(k.ring(0, 0, TABLE_R - 13, 0, P, 144) + k.ring(0, 0, TABLE_R - 38, 0, P, 120), { tone: "lo" }));
  const dial = k.radialTicks(0, 0, TABLE_R - 13, 72, 6, 0, [9, 18], P);
  out.push(Ln(dial.minor, { tone: "lo" }), Ln(dial.major, { tone: "mid" }));
  out.push(Ln(k.ring(0, 0, 150, 0, P, 96), { tone: "faint" }));
  out.push(Ln(k.ring(0, 0, 14, 0, P, 24), { tone: "lo" }), Dots([at([0, 0, 0])], { size: 0.55 }));
  const bolts = Array.from({ length: 6 }, (_, i) => [(TABLE_R - 56) * Math.cos((i * 60 + 15) * DEG), (TABLE_R - 56) * Math.sin((i * 60 + 15) * DEG)]);
  out.push(Ln(bolts.map(([x, y]) => k.ring(x, y, 6, 0, P, 14)).join(""), { tone: "lo" }), Dots(bolts.map(([x, y]) => at([x, y, 0])), { size: 0.42 }));

  // Soft contact shadow of the feet on the turntable.
  out.push(`<path class="iso-halo ped-contact" d="${k.pathOf(Array.from({ length: 40 }, (_, i) => at([150 * Math.cos((i / 40) * 2 * Math.PI), 110 * Math.sin((i / 40) * 2 * Math.PI), 0])), true)}"/>`);
  return out.join("");
}

/** The projected box the whole figure fits in, and the point on the axis that sits at its centre. */
export function framing(P) {
  const { cosE, sinE, k: scale } = k.cameraOf(P);
  const pts = [];
  for (const [x, y] of k.corners(PLINTH, 0)) pts.push(k.iso([x, y, PLINTH_Z - 14], P));
  pts.push(k.iso([ROD[0], ROD[1], ROD_TOP + 24], P), k.iso([0, 0, 1680], P), k.iso([340, -340, 800], P), k.iso([-340, 340, 800], P));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const centreY = (box[1] + box[3]) / 2;
  return { fitW: box[2] - box[0], fitH: box[3] - box[1], home: [0, 0, (P.origin[1] - centreY) / (cosE * scale)], cosE, sinE };
}
