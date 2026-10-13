import * as k from "../vendor/anatomy-kit/kit/iso-kit.mjs";
import * as G from "../vendor/anatomy-kit/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../vendor/anatomy-kit/kit/tube.mjs";
import * as A from "../vendor/anatomy-kit/kit/audit.mjs";

export { k, G, A };

export const DEG = Math.PI / 180;

export function scene(P) {
  const R = A.recorder(P, {});
  const V = G.viewOf(P);
  const KS = G.scaleOf(P);
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const Dots = (points, style) => k.dotsSvg(points, style);

  function put(piece, ref, svg, { bias = 0, shapes = [], name, route, chunk, layer = "main" } = {}) {
    return R.put({ piece, at: ref, bias, svg, move: [0, 0, 0], shapes: shapes.map((shape) => R.solid({ ...shape, name: shape.name ?? name })), name: name ?? R.nameFor(`${piece}.item`), route, chunk, layer });
  }

  const slopeOf = (radius, h = 1e-3) => (s) => (radius(s + h) - radius(s - h)) / (2 * h);

  function meridianOf(radius, s0, s1, n = 30) {
    return Array.from({ length: n + 1 }, (_, i) => {
      const s = s0 + ((s1 - s0) * i) / n;
      const r = i === 0 || i === n ? 0 : Math.max(0.01, radius(s));
      return [s, r, i === 0 || i === n ? 0 : 1];
    });
  }

  // Closed organ of revolution from an analytic radius r(s), s in [0, L], r(0) = r(L) = 0.
  function organ(piece, F, radius, L, { tone = "hi", inner = "", name, bias = 0, knots = 30, extra = "" } = {}) {
    const meridian = meridianOf(radius, 0, L, knots);
    const paths = G.lathe(meridian, F, P, { smooth: { slope: slopeOf(radius), radius, rows: 6 } });
    const id = R.nameFor(name ?? `${piece}.organ`);
    const shape = A.lathe(F, meridian.map(([s, r]) => [s, r]), { radius, name: id });
    put(piece, G.add3(F.o, G.mul3(F.a, L / 2)), S(paths, { tone, inner }) + extra, { bias, shapes: [shape], name: id });
    return { F, radius, L, id };
  }

  function ball(piece, centre, r, { tone = "hi", bias = 0, name, extra = "" } = {}) {
    const id = R.nameFor(name ?? `${piece}.ball`);
    put(piece, centre, S(G.sphereOf(centre, r, P, { steps: G.stepsFor(r, 32) }), { tone }) + extra, { bias, name: id, shapes: [A.ball(centre, r)] });
    return id;
  }

  function turned(piece, F, profile, { tone = "mid", inner = "", name, bias = 0, extra = "", bevel = 0 } = {}) {
    const paths = G.solidOf(profile, F, P, { bevel });
    const id = R.nameFor(name ?? `${piece}.turned`);
    const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
    put(piece, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone, inner }) + extra, { bias, name: id, shapes: [A.solid(F, profile.map(([s, r]) => [s, r]))] });
    return id;
  }

  function slab(piece, plan, z, h, { tone = "mid", bevel = 0.4, steps = 3, name, bias = 0, extra = "", lit = false } = {}) {
    const id = R.nameFor(name ?? `${piece}.slab`);
    const centre = [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2];
    put(piece, centre, S(k.slabOf(plan, z, h, P, steps, bevel), { tone, lit }) + extra, { bias, name: id, shapes: [A.slab(plan, z, h, {}, steps)] });
    return id;
  }

  function cyl(piece, x, y, r, z, h, { tone = "mid", steps = 28, bevel = 0, name, bias = 0, extra = "", crease } = {}) {
    const id = R.nameFor(name ?? `${piece}.cyl`);
    put(piece, [x, y, z + h / 2], S(k.cylinder(x, y, r, z, h, P, steps, bevel), { tone, ...(crease ? { crease } : {}) }) + extra, { bias, name: id, shapes: [A.cylinder(x, y, r, z, h)] });
    return id;
  }

  function prism(piece, F, polygon, s0, s1, { tone = "mid", name, bias = 0, extra = "" } = {}) {
    const id = R.nameFor(name ?? `${piece}.prism`);
    const cx = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
    const cy = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
    const centre = G.add3(G.add3(F.o, G.mul3(F.u, cx)), G.add3(G.mul3(F.v, cy), G.mul3(F.a, (s0 + s1) / 2)));
    put(piece, centre, S(G.prismOf(F, polygon, s0, s1, P), { tone }) + extra, { bias, name: id, shapes: [A.prism(F, polygon, s0, s1)] });
    return id;
  }

  function tube(piece, control, r, { tone = "hi", name, bend = 2.6, maxLength = 12, gaps = [], breaks = [], caps = true, rings = null, bias = 0, spacing, smooth = true } = {}) {
    const rMax = typeof r === "function" ? Math.max(...Array.from({ length: 21 }, (_, i) => r(i / 20))) : r;
    const route = smooth ? G.fillet(control, Math.max(rMax * bend, 3), 12, { P, tube: rMax }) : control;
    const id = R.nameFor(name ?? `${piece}.tube`);
    R.route(id, route, r, { piece, gaps });
    tubePieces(route, r, P, { maxLength, gaps, breaks, caps, rings, spacing: spacing ?? Math.max(0.8, Math.min(2.2, rMax * 0.2)) }).forEach((part, index) =>
      put(piece, part.mid, tubeSvg(part, { tone }), { bias, name: `${id}:${index}`, route: id, chunk: index, shapes: [A.tube(part.points, part.radii)] }),
    );
    return route;
  }

  // Visible polyline of a curve lying on a lathe surface, given as (s, angle) samples.
  function surfaceCurve(F, radius, samples, { least = 0.0 } = {}) {
    const slope = slopeOf(radius);
    const runs = [];
    let run = [];
    for (const [s, angle] of samples) {
      const facing = G.facingOf(F, angle, P, slope(s));
      if (facing > least) run.push(at(G.pointOf(F, s, radius(s), angle)));
      else if (run.length) (runs.push(run), (run = []));
    }
    if (run.length) runs.push(run);
    return runs.filter((r) => r.length > 1).map((r) => k.pathOf ? k.pathOf(r) : "M" + r.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")).join("");
  }

  const surfaceAt = (F, radius, s, direction) => G.pointOf(F, s, radius(s), G.angleToward(F, direction));

  return { R, V, KS, at, S, Ln, Dots, put, organ, ball, turned, slab, cyl, prism, tube, surfaceCurve, surfaceAt, slopeOf, meridianOf };
}

// Egg-shaped radius: r(0) = r(L) = 0 with vertical tangents; `lean` narrows the far end.
export function egg(R, L, lean = 0.4, power = 1) {
  let peak = 0;
  for (let i = 1; i < 400; i++) {
    const t = i / 400;
    peak = Math.max(peak, Math.sqrt(t * (1 - t)) * Math.pow(1 - lean * t, power));
  }
  return (s) => {
    const t = Math.min(1, Math.max(0, s / L));
    return (R * Math.sqrt(Math.max(0, t * (1 - t))) * Math.pow(1 - lean * t, power)) / peak;
  };
}
