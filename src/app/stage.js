// ── Stage: what the body shows and how it moves ──
// Layers, selection with its cutaway, the camera, touch gestures, the stand's moving parts,
// labels pinned to 3D points, and the scenes that processes and cases play on the model.
const Stage = (() => {
  const B = Body;
  const S = B.S;
  const CAM = D.cam;
  const el = {};
  const layers = Object.assign({ piel: true, hueso: true, organo: true, vaso: true, nervio: true }, store.get("layers", {}));
  let selected = null, part = -1, touched = false, idleClock = 0, sceneOn = false;
  const hidden = new Set();
  const ghosts = {};
  const only = { on: false, ids: new Set() };
  const lungs = { der: { collapse: 0, to: 0 }, izq: { collapse: 0, to: 0 } };
  const drive = { contract: 1, contractTo: 1, breathScale: 1 };
  const pins = [];

  const RIDERS = ["corazon", "valvulas", "cor-izq", "cor-da", "cor-cx", "cor-der", "venas-cardiacas"];
  const LUNG = { "pulmon-der-sup": "der", "pulmon-der-med": "der", "pulmon-der-inf": "der", "pulmon-izq-sup": "izq", "pulmon-izq-inf": "izq" };
  const GUT = ["esofago", "estomago", "duodeno", "yeyuno", "ileon", "colon", "apendice", "recto"];
  const PULSE = { aorta: 1.5, "art-pulmonar": 1.1, carotidas: 0.9, subclavias: 0.9, "tronco-celiaco": 0.7, mesentericas: 0.6, "art-renales": 0.6, "art-iliacas": 0.9, "cor-izq": 0.4, "cor-da": 0.4, "cor-cx": 0.4, "cor-der": 0.4 };
  const VEINS = ["vcs", "vci", "yugulares", "ven-renales", "ven-iliacas", "porta", "venas-cardiacas", "ven-pulmonares"];
  // How far each organ under the diaphragm follows it down in a quiet breath (mm).
  const SINK = { higado: 13, vesicula: 13, estomago: 11, bazo: 11, pancreas: 5, duodeno: 5, "rinon-der": 8, "rinon-izq": 8, suprarrenales: 8, colon: 3, yeyuno: 3 };
  const CAGE = ["costillas", "cartilagos", "esternon"];
  const base = {};

  // ── vertebral levels from the model's own vertebrae ─────────────────────
  const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };
  const LEVELS = [];
  for (const [id, letter] of [["col-cervical", "C"], ["col-toracica", "T"], ["col-lumbar", "L"]]) {
    for (const p of S[id].meta.parts) {
      const word = p.n.split(" ")[0];
      const n = p.n === "atlas" ? 1 : p.n === "axis" ? 2 : ORD[word];
      LEVELS.push({ name: letter + n, z: p.c[2], lo: p.lo[2], hi: p.hi[2] });
    }
  }
  LEVELS.push({ name: "S", z: S.sacro.meta.c[2], lo: S.sacro.meta.lo[2], hi: S.sacro.meta.hi[2] });
  LEVELS.sort((a, b) => b.z - a.z);
  function levelAt(z) {
    if (z > LEVELS[0].hi + 12 || z < LEVELS[LEVELS.length - 1].lo - 12) return null;
    let best = LEVELS[0];
    for (const l of LEVELS) if (Math.abs(l.z - z) < Math.abs(best.z - z)) best = l;
    return best.name;
  }
  function levelSpan(lo, hi) {
    const a = levelAt(hi), b = levelAt(lo);
    if (!a && !b) return "";
    if (!a || !b || a === b) return a || b;
    return `${a}–${b}`;
  }
  const vertebra = (name) => LEVELS.find((l) => l.name === name);

  // ── anchors: "id", "id@0.3" (along its flow), "id#part name", "T10" (a level), [x, y, z] ──
  const NAMED = {
    "@sa": () => B.along("vcs", 0),
    "@la": () => B.along("ven-pulmonares", 0.03),
    "@ra": () => { const a = B.along("vcs", 0), b = B.along("vci", 0); return [(a[0] + b[0]) / 2 - 6, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; },
    "@apex": () => B.heart.base.map((v, i) => v + B.heart.axis[i] * B.heart.length * 0.95),
    "@av": () => B.heart.base.map((v, i) => v + B.heart.axis[i] * B.heart.length * 0.37),
    "@lv": () => B.heart.base.map((v, i) => v + B.heart.axis[i] * B.heart.length * 0.7 + [12, 6, 0][i]),
    "@inferior": () => B.heart.base.map((v, i) => v + B.heart.axis[i] * B.heart.length * 0.7 + [-4, 4, -26][i]),
    "@anterior": () => B.heart.base.map((v, i) => v + B.heart.axis[i] * B.heart.length * 0.66 + [6, -26, 6][i]),
  };
  function anchor(spec) {
    if (Array.isArray(spec)) return spec;
    if (NAMED[spec]) return NAMED[spec]();
    if (spec.startsWith("mid:")) {
      const [a, b] = spec.slice(4).split(",").map((x) => anchor(x.trim()));
      return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    }
    const level = vertebra(spec);
    if (level) return [0, 55, level.z];
    // "id@0.4/part name" follows one part only (one ureter of the two).
    const [head, piece] = spec.split("/");
    const [id, rest] = head.split(/[@#]/);
    const s = S[id];
    if (!s) return [0, 0, 1000];
    if (head.includes("#")) {
      const p = s.meta.parts.find((q) => q.n === rest);
      return p ? p.c : s.meta.c;
    }
    if (head.includes("@")) return B.along(id, Number(rest), piece ? s.meta.parts.findIndex((q) => q.n === piece) : -1);
    return s.meta.c;
  }
  const flowAt = (spec) => {
    const [head, piece] = spec.split("/");
    const [id, f] = head.split("@");
    const part = piece && S[id].meta.parts.find((q) => q.n === piece);
    const [lo, hi] = part ? part.flow : S[id].meta.flow;
    return lo + (hi - lo) * Number(f);
  };

  // ── setup ────────────────────────────────────────────────────────────────
  function setup() {
    const lungBox = { der: { lo: [9e9, 9e9, 9e9], hi: [-9e9, -9e9, -9e9] }, izq: { lo: [9e9, 9e9, 9e9], hi: [-9e9, -9e9, -9e9] } };
    for (const [id, side] of Object.entries(LUNG)) {
      for (let i = 0; i < 3; i++) {
        lungBox[side].lo[i] = Math.min(lungBox[side].lo[i], S[id].meta.lo[i]);
        lungBox[side].hi[i] = Math.max(lungBox[side].hi[i], S[id].meta.hi[i]);
      }
    }
    for (const s of B.LIST) {
      const c = s.meta.c;
      s.push = new Float32Array(3);
      s.pushTo = new Float32Array(3);
      if (s.id !== "piel") s.explode.set([c[0] * 0.95, c[1] * 1.1, (c[2] - 1050) * 0.34]);
      s.ride = RIDERS.includes(s.id);
      if (LUNG[s.id]) {
        const box = lungBox[LUNG[s.id]];
        s.mode = 2;
        s.pivot.set([LUNG[s.id] === "der" ? box.hi[0] - 14 : box.lo[0] + 14, (box.lo[1] + box.hi[1]) / 2, box.lo[2] + (box.hi[2] - box.lo[2]) * 0.58, 1]);
        s.lb.set([box.lo[2], box.hi[2], 0, 0]);
        s.side = LUNG[s.id];
      } else if (s.id === "diafragma") {
        s.mode = 4;
        s.lb.set([s.meta.lo[2] + (s.meta.hi[2] - s.meta.lo[2]) * 0.3, s.meta.hi[2], 0, 0]);
      } else if (PULSE[s.id]) {
        s.mode = 3;
        base[s.id] = { wave: [1100, 0, PULSE[s.id], 0], flow: [0, 60, 0, 0.3] };
      } else if (VEINS.includes(s.id)) {
        s.mode = 3;
        base[s.id] = { wave: [1, 0, 0, 0], flow: [-64, 36, 0.13, 0] };
      } else if (GUT.includes(s.id)) {
        s.mode = 3;
        base[s.id] = { wave: [s.id === "esofago" ? 30 : 16, 150, s.id === "esofago" ? 0.4 : 1.2, 1], flow: [0, 60, 0, 0] };
      } else if (s.id === "ureteres") {
        s.mode = 3;
        base[s.id] = { wave: [24, 110, 0.5, 1], flow: [0, 60, 0, 0] };
      }
      if (CAGE.includes(s.id)) s.pivot.set([0, 62, 1250, 1]);
      if (base[s.id]) for (const key of ["wave", "flow"]) { s.fx[key].set(base[s.id][key]); s.to[key].set(base[s.id][key]); }
    }
    const h = D.body.heart;
    B.heart.base = h.base;
    B.heart.axis = h.axis;
    B.heart.length = h.length;
    applyLayers();
  }

  // ── layers and visibility ────────────────────────────────────────────────
  function applyLayers() {
    let others = false;
    for (const s of B.LIST) {
      let on = layers[s.layer] ? 1 : 0;
      if (only.on) on = only.ids.has(s.id) ? 1 : s.id === "piel" && layers.piel ? 1 : 0;
      if (hidden.has(s.id)) on = 0;
      if (on && ghosts[s.id] !== undefined) on = ghosts[s.id];
      s.show = on;
      if (on > 0 && s.id !== "piel") others = true;
    }
    B.look.glassTo = others ? 1 : 0;
    $$(".rail button[data-layer]").forEach((b) => b.setAttribute("aria-pressed", String(!!layers[b.dataset.layer])));
  }
  function setLayer(id, on) {
    layers[id] = on;
    store.set("layers", layers);
    applyLayers();
    if (selected && !S[selected].show) select(null);
  }
  /** Make sure a structure can be seen: switch its layer on. */
  function reveal(id) {
    const s = S[id];
    if (s && !layers[s.layer]) setLayer(s.layer, true);
  }

  // ── selection ────────────────────────────────────────────────────────────
  const radiusOf = (s) => Math.hypot(s.meta.hi[0] - s.meta.lo[0], s.meta.hi[1] - s.meta.lo[1], s.meta.hi[2] - s.meta.lo[2]) / 2;
  const zoomFor = (radius) => clamp(CAM.fitH / (CAM.k * CAM.cosE) / (radius * 3.3), 1, 10);
  function select(id, { focus = true, quiet = false, partIndex = -1 } = {}) {
    if (id && !S[id]) id = null;
    selected = id;
    part = partIndex;
    B.look.selected = id;
    B.look.lensTo = id && id !== "piel" ? 1 : 0;
    for (const s of B.LIST) s.dimTo = id && s.id !== id ? 0.42 : 0;
    if (id) {
      const s = S[id];
      reveal(id);
      B.look.lensAt = s.meta.c.slice();
      B.look.lensR = clamp(radiusOf(s) * 0.8, 34, 190);
      if (focus) {
        const want = zoomFor(radiusOf(s));
        B.view.focusTo = s.meta.c.slice();
        B.view.panTo = [0, 0];
        if (B.view.zoomTo < want * 0.7 || B.view.zoomTo > want * 1.8) B.view.zoomTo = want;
      }
    }
    readout();
    if (!quiet) bus.emit("select", id);
  }
  function home() {
    B.view.focusTo = CAM.home.slice();
    B.view.zoomTo = 1;
    B.view.panTo = [0, 0];
  }
  function look({ focus, zoom, turn, pan } = {}) {
    if (focus !== undefined) B.view.focusTo = focus === "home" ? CAM.home.slice() : anchor(focus).slice();
    if (zoom !== undefined) B.view.zoomTo = zoom;
    if (turn !== undefined) { B.view.turnTo = nearestTurn(turn); B.view.spin = 0; touched = true; }
    B.view.panTo = pan || [0, 0];
  }
  const nearestTurn = (to) => {
    const two = Math.PI * 2;
    return to + Math.round((B.view.turn - to) / two) * two;
  };

  function readout() {
    const s = selected && S[selected];
    const span = s ? levelSpan(s.meta.lo[2], s.meta.hi[2]) : "";
    el.title.textContent = s ? s.info.name : sceneTitle || "Cuerpo humano · 1:1";
    el.level.textContent = s && span ? `Nivel ${span}` : "";
    cursorTo = s ? clamp(s.meta.c[2], 60, CAM.rodTop - 40) : CAM.cursorRest;
  }
  let sceneTitle = "";
  let cursorTo = D.cam.cursorRest, cursorZ = D.cam.cursorRest;

  // ── scenes ───────────────────────────────────────────────────────────────
  const COLORS = { isquemia: [0.24, 0.2, 0.42], necrosis: [0.13, 0.11, 0.16], inflamado: [0.93, 0.2, 0.16], pus: [0.86, 0.8, 0.42], liquido: [0.36, 0.62, 0.9], sangre: [0.6, 0.05, 0.08], aire: [0.72, 0.9, 1.0], bilis: [0.5, 0.62, 0.16], palido: [0.86, 0.84, 0.8], cianosis: [0.36, 0.38, 0.62], edema: [0.78, 0.82, 0.92], calculo: [0.95, 0.86, 0.5], consolidado: [0.95, 0.9, 0.72], sano: [0.3, 0.8, 0.5], oxigenada: [0.92, 0.2, 0.18], desoxigenada: [0.2, 0.34, 0.8], electrico: [1.0, 0.86, 0.3], alimento: [0.98, 0.8, 0.36], orina: [0.98, 0.86, 0.34] };
  const rgb = (c) => (typeof c === "string" ? COLORS[c] || hexToRgb(c) : c);
  function setFx(id, fx) {
    const s = S[id];
    if (!s) return;
    for (const [key, value] of Object.entries(fx)) {
      if (key === "tint") s.to.tint.set([...rgb(value[0]), value[1]]);
      else if (key === "spot" || key === "spot2") {
        const [where, radius, colour, strength = 0.9] = value;
        const k = key === "spot" ? "A" : "B";
        s.to["spot" + k].set([...anchor(where), radius]);
        s.to["spotCol" + k].set([...rgb(colour), strength]);
      } else if (key === "level") {
        const [z, colour, strength = 0.85] = value;
        s.to.level.set([typeof z === "string" ? anchor(z)[2] : z, 1, 0, 0]);
        s.to.levelCol.set([...rgb(colour), strength]);
      } else if (key === "cut") {
        // "id@0.4" stops the flow beyond that point; { at, part } limits it to one named part.
        const at = typeof value === "string" ? value : value.at;
        const piece = typeof value === "string" ? -1 : s.meta.parts.findIndex((q) => q.n === value.part);
        s.to.cut.set([flowAt(at), 1, piece, 0]);
        if (s.fx.cut[1] < 0.01) s.fx.cut[2] = piece;
      } else if (key === "push") s.pushTo.set(value);
      else if (key === "swell") s.to.swell[0] = value;
      else if (key === "bulge") {
        const [from, to, mm] = value;
        const [lo, hi] = s.meta.flow;
        s.to.swell[1] = lo + (hi - lo) * from;
        s.to.swell[2] = lo + (hi - lo) * to;
        s.to.swell[3] = mm;
      } else if (key === "flow") s.to.flow.set(value);
      else if (key === "wave") s.to.wave.set(value);
      else if (key === "streak") {
        // Visible flow along the structure: [speed mm/s, strength]
        s.to.flow.set([value[0], value[2] || 44, value[1], s.to.flow[3]]);
      }
    }
  }
  function clearFx(id) {
    const s = S[id];
    for (const key of ["tint", "spotA", "spotColA", "spotB", "spotColB", "level", "levelCol", "swell"]) s.to[key].fill(0);
    s.to.cut[1] = 0;
    s.pushTo.fill(0);
    s.to.wave.set(base[id] ? base[id].wave : [0, 0, 0, 0]);
    s.to.flow.set(base[id] ? base[id].flow : [0, 60, 0, 0]);
  }
  function scene(spec = {}) {
    sceneOn = true;
    if (spec.reset !== false) for (const s of B.LIST) clearFx(s.id);
    hidden.clear();
    only.on = false;
    only.ids.clear();
    for (const key of Object.keys(ghosts)) delete ghosts[key];
    Object.assign(ghosts, spec.ghost || {});
    if (spec.only) { only.on = true; for (const id of spec.only) only.ids.add(id); }
    for (const id of spec.hide || []) hidden.add(id);
    if (spec.layers) for (const l of D.layers) layers[l.id] = spec.layers.includes(l.id);
    applyLayers();
    for (const [id, fx] of Object.entries(spec.fx || {})) setFx(id, fx);
    lungs.der.to = spec.lungs?.der ?? 0;
    lungs.izq.to = spec.lungs?.izq ?? 0;
    drive.contractTo = spec.contract ?? 1;
    sceneTitle = spec.title || "";
    select(spec.select ?? null, { focus: false, quiet: true });
    if (spec.focus || spec.zoom || spec.turn !== undefined) look({ focus: spec.focus ?? "home", zoom: spec.zoom ?? 1, turn: spec.turn, pan: spec.pan });
    setPins(spec.pins || []);
    if (spec.explode !== undefined) B.look.explodeTo = spec.explode;
    readout();
  }
  function endScene() {
    if (!sceneOn) return;
    sceneOn = false;
    for (const s of B.LIST) clearFx(s.id);
    hidden.clear();
    only.on = false;
    for (const key of Object.keys(ghosts)) delete ghosts[key];
    Object.assign(layers, { piel: true, hueso: true, organo: true, vaso: true, nervio: true }, store.get("layers", {}));
    applyLayers();
    lungs.der.to = lungs.izq.to = 0;
    drive.contractTo = 1;
    sceneTitle = "";
    setPins([]);
    B.look.explodeTo = 0;
    select(null, { quiet: true });
    readout();
  }

  // ── pins: labels that stay on a 3D point as the body turns ──────────────
  function setPins(list) {
    for (const p of pins) p.el.remove();
    pins.length = 0;
    for (const item of list) {
      const node = document.createElement("div");
      node.className = "pin";
      if (item.tone) node.dataset.tone = item.tone;
      node.innerHTML = `<i></i><span>${esc(item.text)}</span>`;
      el.pins.appendChild(node);
      pins.push({ el: node, at: anchor(item.at), side: item.side || "" });
    }
  }
  function placePins() {
    for (const p of pins) {
      const [x, y] = B.toScreen(p.at);
      const inside = x > 8 && x < B.view.width - 8 && y > B.view.insetNow.top && y < B.view.height - B.view.insetNow.bottom + 8;
      p.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      p.el.dataset.flip = x > B.view.width * 0.6 || p.side === "left" ? "1" : "";
      p.el.style.opacity = inside ? "1" : "0";
    }
  }

  // ── gestures ─────────────────────────────────────────────────────────────
  const pointers = new Map();
  let gesture = null, lastTap = { t: 0, x: 0, y: 0 };
  function bind(canvas) {
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      touched = true;
      B.view.spin = 0;
      B.view.turnTo = B.view.turn;
      const pts = [...pointers.values()];
      gesture = pts.length === 1
        ? { kind: "turn", x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, turn: B.view.turn, pan: B.view.panTo.slice(), vx: 0 }
        : { kind: "pinch", d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), cx: (pts[0].x + pts[1].x) / 2, cy: (pts[0].y + pts[1].y) / 2, zoom: B.view.zoomTo, pan: B.view.panTo.slice(), moved: 99 };
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId) || !gesture) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = [...pointers.values()];
      if (gesture.kind === "turn" && pts.length === 1) {
        const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
        gesture.moved = Math.max(gesture.moved, Math.hypot(dx, dy));
        if (gesture.moved < 6) return;
        const turn = gesture.turn + dx * 0.0085;
        gesture.vx = (turn - B.view.turnTo) * 60;
        B.view.turnTo = B.view.turn = turn;
        const limit = B.view.height * 0.5 * B.view.zoomTo;
        B.view.panTo[1] = clamp(gesture.pan[1] + dy, -limit, limit);
        B.view.pan[1] = B.view.panTo[1];
      } else if (gesture.kind === "pinch" && pts.length >= 2) {
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const cx = (pts[0].x + pts[1].x) / 2, cy = (pts[0].y + pts[1].y) / 2;
        B.view.zoomTo = clamp(gesture.zoom * (d / gesture.d), 0.8, 16);
        B.view.panTo = [gesture.pan[0] + cx - gesture.cx, gesture.pan[1] + cy - gesture.cy];
      }
    });
    const up = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      const g = gesture;
      if (pointers.size === 0) gesture = null;
      else if (pointers.size === 1) {
        const p = [...pointers.values()][0];
        gesture = { kind: "turn", x: p.x, y: p.y, t: 0, moved: 99, turn: B.view.turn, pan: B.view.panTo.slice(), vx: 0 };
        return;
      }
      if (!g || g.kind !== "turn") return;
      if (g.moved < 8 && performance.now() - g.t < 500) {
        const box = canvas.getBoundingClientRect();
        const x = e.clientX - box.left, y = e.clientY - box.top;
        const now = performance.now();
        const double = now - lastTap.t < 320 && Math.hypot(x - lastTap.x, y - lastTap.y) < 28;
        lastTap = { t: now, x, y };
        bus.emit("tap", { hit: B.pick(x, y, 9), x, y, double });
      } else if (Math.abs(g.vx) > 0.6) B.view.spin = clamp(g.vx * 0.5, -3.5, 3.5);
      if (B.view.zoomTo < 1) { B.view.zoomTo = 1; B.view.panTo = [0, 0]; }
    };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      touched = true;
      B.view.zoomTo = clamp(B.view.zoomTo * Math.exp(-e.deltaY * 0.0015), 1, 16);
    }, { passive: false });
    canvas.addEventListener("keydown", (e) => {
      const step = { ArrowLeft: -0.3, ArrowRight: 0.3 }[e.key];
      if (step) { touched = true; B.view.turnTo += step; e.preventDefault(); }
      else if (e.key === "+" || e.key === "=") B.view.zoomTo = clamp(B.view.zoomTo * 1.3, 1, 16);
      else if (e.key === "-") B.view.zoomTo = clamp(B.view.zoomTo / 1.3, 1, 16);
      else if (e.key === "Escape") { select(null); home(); }
    });
  }

  // ── frame ────────────────────────────────────────────────────────────────
  let pedShown = "";
  function frame(t, dt) {
    const v = B.view;
    if (!gesture) {
      if (Math.abs(v.spin) > 0.002) {
        v.turn += v.spin * dt;
        v.turnTo = v.turn;
        v.spin *= Math.exp(-dt / 0.35);
      } else {
        if (!touched && !still.matches && !sceneOn) {
          idleClock += dt;
          v.turnTo = -0.3 + 0.45 * Math.sin(idleClock * 0.32 - 0.27);
        }
        v.turn += (v.turnTo - v.turn) * (1 - Math.exp(-dt / 0.3));
      }
    }
    // The heart, the pulse and the breath.
    const m = Physio.mechanics(t);
    drive.contract += (drive.contractTo - drive.contract) * (1 - Math.exp(-dt / 0.6));
    const calm = still.matches;
    B.heart.sys = calm ? 0 : m.sys * drive.contract;
    B.heart.atr = calm ? 0 : m.atr;
    B.heart.quiver = !calm && Physio.now.rhythm === "fv" ? 0.9 : 0;
    Physio.beats(t, B.beats.age, B.beats.q);
    if (calm) B.beats.q.fill(0);
    const b = calm ? 0 : Physio.breath;
    const settle = 1 - Math.exp(-dt / 0.6);
    for (const side of ["der", "izq"]) lungs[side].collapse += (lungs[side].to - lungs[side].collapse) * (1 - Math.exp(-dt / 0.7));
    for (const s of B.LIST) {
      for (let i = 0; i < 3; i++) { s.push[i] += (s.pushTo[i] - s.push[i]) * settle; s.shift[i] = s.push[i]; }
      if (s.mode === 2) s.la.set([b, lungs[s.side].collapse, 15, 0]);
      else if (s.mode === 4) s.la[0] = 17 * b;
      else if (SINK[s.id]) s.shift[2] -= SINK[s.id] * b;
      else if (CAGE.includes(s.id)) s.pivot[3] = 1 + 0.012 * b;
    }
    // The stand follows the camera; the cursor slides to the selected level.
    const text = `translate(${v.tx.toFixed(2)} ${v.ty.toFixed(2)}) scale(${v.scale.toFixed(4)})`;
    if (text !== pedShown) { pedShown = text; el.ped.setAttribute("transform", text); }
    cursorZ += (cursorTo - cursorZ) * (1 - Math.exp(-dt / 0.25));
    el.cursor.setAttribute("transform", `translate(0 ${(-(cursorZ - CAM.cursorRest) * CAM.cosE * CAM.k).toFixed(2)})`);
    const mark = B.toBox(B.turned([0, -238, 0]));
    el.index.setAttribute("cx", mark[0].toFixed(2));
    el.index.setAttribute("cy", mark[1].toFixed(2));
    el.index.setAttribute("r", (3.4 / v.scale).toFixed(2));
    placePins();
  }

  function init() {
    el.title = $("[data-title]");
    el.level = $("[data-level]");
    el.ped = $(".ped-g");
    el.cursor = $(".ped-cursor");
    el.index = $(".ped-index");
    el.pins = $(".pins");
    setup();
    bind($(".gl"));
    readout();
  }

  return {
    init, frame, select, home, look, scene, endScene, setFx, clearFx, setLayer, reveal, applyLayers, anchor, levelAt, levelSpan, setPins, readout, zoomFor, radiusOf,
    layers, lungs, drive, LEVELS, COLORS,
    get selected() { return selected; }, get part() { return part; }, get sceneOn() { return sceneOn; },
    touch() { touched = true; },
  };
})();
