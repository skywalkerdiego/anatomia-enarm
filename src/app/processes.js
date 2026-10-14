// ── Processes: physiology played step by step on the body ──
// Each step sets a scene (what shows, what flows, where the camera looks), the vital signs and
// the clock's speed; some steps add a live animation or the Wiggers chart, both read from Physio.
const Processes = (() => {
  const state = { id: null, step: 0, auto: false, autoAt: 0, rhythm: false };
  const seen = store.get("processes", {});
  let chart = null;

  // ── the cardiac cycle as curves over one beat at 72 bpm (seconds from the P wave) ──
  const W = { ivc: 0.19, open: 0.24, close: 0.46, mitral: 0.54, end: 0.833 };
  const hump = (x) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 2);
  const lvp = (t) => {
    if (t < W.ivc) return 7 + 3 * hump((t - 0.05) / 0.13);
    if (t < W.open) return mix(9, 80, smooth(W.ivc, W.open, t));
    if (t < W.close) return 80 + 40 * Math.sin(Math.PI * ((t - W.open) / (W.close - W.open)) * 0.86);
    if (t < W.mitral) return mix(97, 6, smooth(W.close, W.mitral, t));
    return mix(5, 7, (t - W.mitral) / (W.end - W.mitral));
  };
  const aop = (t) => {
    if (t >= W.open && t < W.close) return lvp(t) - 3;
    const s = t >= W.close ? t - W.close : t + W.end - W.close;
    return 78 + 17 * Math.exp(-s / 0.42) + 5 * hump((s - 0.012) / 0.07);
  };
  const lap = (t) => 5 + 4 * hump((t - 0.04) / 0.14) + 2.4 * hump((t - 0.18) / 0.07) + (t > 0.27 && t < W.mitral ? 7 * smooth(0.27, W.mitral, t) - 2 * (1 - smooth(0.27, 0.34, t)) : 0) + (t >= W.mitral ? 7 * (1 - smooth(W.mitral, 0.64, t)) : 0) - (t > 0.2 && t <= 0.27 ? 2 * smooth(0.2, 0.27, t) : 0);
  const volume = (t) => {
    if (t < 0.06) return 108;
    if (t < W.ivc) return 108 + 14 * smooth(0.06, 0.17, t);
    if (t < W.open) return 122;
    if (t < W.close) return mix(122, 52, smooth(W.open, W.close, t) ** 0.8);
    if (t < W.mitral) return 52;
    return 52 + 50 * (1 - Math.exp(-(t - W.mitral) / 0.07)) + 6 * ((t - W.mitral) / (W.end - W.mitral));
  };
  const PHASES = [
    { id: "llenado", from: W.mitral - W.end, to: 0.04, name: "Llenado" },
    { id: "auricular", from: 0.04, to: W.ivc, name: "Sístole auricular" },
    { id: "isovol", from: W.ivc, to: W.open, name: "Contracción isovolumétrica" },
    { id: "eyeccion", from: W.open, to: W.close, name: "Eyección" },
    { id: "relajacion", from: W.close, to: W.mitral, name: "Relajación isovolumétrica" },
    { id: "llenado", from: W.mitral, to: W.end, name: "Llenado" },
  ];

  function drawWiggers(t) {
    if (!chart || !chart.isConnected) return;
    const step = current();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const cw = chart.clientWidth, ch = chart.clientHeight;
    if (chart.width !== Math.round(cw * dpr)) { chart.width = Math.round(cw * dpr); chart.height = Math.round(ch * dpr); }
    const c = chart.getContext("2d");
    const css = getComputedStyle(document.body);
    const ink = css.getPropertyValue("--anatomy-strong").trim(), soft = css.getPropertyValue("--anatomy-muted").trim(), accent = css.getPropertyValue("--accent").trim();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, cw, ch);
    const L = 34, R = cw - 8, x = (s) => L + ((R - L) * s) / W.end;
    const rows = { p: [10, ch * 0.5], v: [ch * 0.56, ch * 0.76], e: [ch * 0.8, ch - 6] };
    const yp = (mm) => rows.p[1] - ((rows.p[1] - rows.p[0]) * mm) / 130;
    const yv = (ml) => rows.v[1] - ((rows.v[1] - rows.v[0]) * (ml - 40)) / 90;
    // The phase this step explains, as a band.
    for (const ph of PHASES) {
      if (ph.id !== step.phase) continue;
      c.fillStyle = accent;
      c.globalAlpha = 0.14;
      c.fillRect(x(Math.max(0, ph.from)), 4, x(ph.to) - x(Math.max(0, ph.from)), ch - 8);
      c.globalAlpha = 1;
    }
    c.strokeStyle = soft;
    c.globalAlpha = 0.28;
    c.lineWidth = 1;
    c.setLineDash([2, 3]);
    for (const s of [W.ivc, W.open, W.close, W.mitral]) { c.beginPath(); c.moveTo(x(s), 4); c.lineTo(x(s), ch - 4); c.stroke(); }
    c.setLineDash([]);
    c.globalAlpha = 1;
    const plot = (fn, y, colour, width = 1.6) => {
      c.strokeStyle = colour;
      c.lineWidth = width;
      c.beginPath();
      for (let i = 0; i <= 160; i++) { const s = (W.end * i) / 160; i ? c.lineTo(x(s), y(fn(s))) : c.moveTo(x(s), y(fn(s))); }
      c.stroke();
    };
    plot(aop, yp, "#f08a3c");
    plot(lap, yp, "#4f8df0");
    plot(lvp, yp, "#e5484d", 2);
    plot(volume, yv, "#30a46c", 1.8);
    const beat = Physio.cycle(t);
    c.strokeStyle = ink;
    c.lineWidth = 1.3;
    c.beginPath();
    for (let i = 0; i <= 200; i++) {
      const s = (W.end * i) / 200;
      const v = Physio.ecgAt(beat.start + s);
      const y = rows.e[1] - (rows.e[1] - rows.e[0]) * clamp((v + 0.25) / 1.3);
      i ? c.lineTo(x(s), y) : c.moveTo(x(s), y);
    }
    c.stroke();
    c.font = `600 9px ${css.getPropertyValue("--anatomy-mono")}`;
    c.fillStyle = soft;
    c.textAlign = "left";
    c.fillText("120", 2, yp(120) + 3);
    c.fillText("80", 2, yp(80) + 3);
    c.fillText("mL", 2, rows.v[0] + 8);
    c.fillText("ECG", 2, rows.e[0] + 10);
    c.fillStyle = "#e5484d"; c.fillText("VI", x(0.33), yp(124) + 1);
    c.fillStyle = "#f08a3c"; c.fillText("Aorta", x(0.6), yp(96));
    c.fillStyle = "#4f8df0"; c.fillText("AI", x(0.66), yp(17));
    c.fillStyle = "#30a46c"; c.fillText("Volumen VI", x(0.6), rows.v[0] + 2);
    c.fillStyle = soft; c.fillText("mmHg", x(0.7), 14);
    c.fillStyle = soft;
    c.textAlign = "center";
    c.fillText("S1", x(W.ivc), ch - 2);
    c.fillText("S2", x(W.close), ch - 2);
    // Where the heart is now.
    const pos = clamp(beat.pos, 0, W.end);
    c.strokeStyle = accent;
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x(pos), 4); c.lineTo(x(pos), ch - 10); c.stroke();
    c.fillStyle = accent;
    c.beginPath(); c.arc(x(pos), yp(lvp(pos)), 3.2, 0, 7); c.fill();
    c.beginPath(); c.arc(x(pos), yv(volume(pos)), 3.2, 0, 7); c.fill();
  }

  // ── live animations ──────────────────────────────────────────────────────
  const direct = (id, key, values) => { const s = Body.S[id]; s.fx[key].set(values); s.to[key].set(values); };
  const ANIM = {
    // The wave of depolarisation, from the sinus node to the last of the ventricles.
    conduccion(t) {
      const { pos } = Physio.cycle(t);
      const gold = Stage.COLORS.electrico;
      const sa = Stage.anchor("@sa"), av = Stage.anchor("@av"), apex = Stage.anchor("@apex"), lv = Stage.anchor("@lv");
      const atria = smooth(0.0, 0.1, pos) * (1 - smooth(0.12, 0.2, pos));
      const node = smooth(0.06, 0.1, pos) * (1 - smooth(0.17, 0.22, pos));
      const vent = smooth(0.15, 0.2, pos) * (1 - smooth(0.26, 0.4, pos));
      if (atria > node && atria > vent) {
        direct("corazon", "spotA", [...sa, 12 + 62 * smooth(0, 0.1, pos)]);
        direct("corazon", "spotColA", [...gold, 0.85 * atria]);
      } else {
        const grow = smooth(0.15, 0.24, pos);
        const from = vent > 0.02 ? apex.map((v, i) => mix(v, lv[i], grow * 0.6)) : av;
        direct("corazon", "spotA", [...from, vent > 0.02 ? 16 + 74 * grow : 15]);
        direct("corazon", "spotColA", [...gold, vent > 0.02 ? 0.9 * vent : 0.95 * node]);
      }
      const repol = smooth(0.34, 0.42, pos) * (1 - smooth(0.46, 0.58, pos));
      direct("corazon", "spotB", [...lv, 80]);
      direct("corazon", "spotColB", [0.55, 0.75, 1, 0.35 * repol]);
    },
    // A bolus travelling along the gut between two points of its length (mm from the mouth of the oesophagus).
    bolo(t, step) {
      const [from, to, seconds] = step.bolo;
      const f = mix(from, to, (t / seconds) % 1);
      for (const id of ["esofago", "estomago", "duodeno", "yeyuno", "ileon", "colon", "recto"]) {
        const s = Body.S[id];
        const [lo, hi] = s.meta.flow;
        const inside = f > lo - 20 && f < hi + 20;
        direct(id, "swell", [0, f - 22, f + 22, inside ? 4.2 : 0]);
        direct(id, "spotColA", [...Stage.COLORS.alimento, 0]);
      }
    },
    // Drops of urine down the ureters.
    orina(t) {
      const s = Body.S.ureteres;
      const [lo, hi] = s.meta.flow;
      const f = mix(lo, hi, (t / 4) % 1);
      direct("ureteres", "swell", [0, f - 14, f + 14, 2.2]);
    },
  };

  // ── views ────────────────────────────────────────────────────────────────
  const current = () => D.processes.find((p) => p.id === state.id)?.steps[state.step] || {};
  function listHtml() {
    const cards = D.processes.map((p) => `<button class="card" data-open="${p.id}" style="--hue:${p.hue}"><span class="glyph">${icon(p.glyph)}</span><b>${esc(p.title)}</b><small>${esc(p.blurb)}</small><span class="meta">${p.steps.length} pasos${seen[p.id] ? ` · ${icon("check").replace('class="ic"', 'class="ic" style="width:12px;height:12px"')} visto` : ""}</span></button>`).join("");
    return `<div class="head"><h2><span class="sub">Fisiología en movimiento</span>Procesos</h2></div><p class="muted" style="font-size:13.5px">Cada proceso se reproduce sobre el cuerpo: lo que ves moverse sale del mismo modelo que dibuja el monitor.</p><div class="grid">${cards}<button class="card" data-rhythms style="--hue:#30a46c"><span class="glyph">${icon("flow")}</span><b>Ritmos del monitor</b><small>Ocho trazos: cómo se ven y qué hacer.</small><span class="meta">ECG en vivo</span></button></div>`;
  }
  function stepHtml() {
    const p = D.processes.find((x) => x.id === state.id);
    const s = p.steps[state.step];
    const n = p.steps.length;
    const facts = s.facts ? `<div class="keyfacts">${s.facts.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : "";
    const slow = s.slow ? `<label class="speed">Cámara lenta<input type="range" min="0.1" max="1" step="0.05" value="${Physio.speed}" aria-label="Velocidad"><span data-speed>${Math.round(Physio.speed * 100)} %</span></label>` : "";
    return `<div class="head"><button class="round" data-act="list" aria-label="Volver a los procesos">${icon("back")}</button><h2><span class="sub">${esc(p.title)} · ${state.step + 1} de ${n}</span>${esc(s.title)}</h2><button class="round" data-act="auto" aria-pressed="${state.auto}" aria-label="Reproducir todos los pasos">${icon(state.auto ? "pause" : "play")}</button></div><div class="steps">${p.steps.map((_, i) => `<i ${i < state.step ? "data-done" : i === state.step ? "data-now" : ""}></i>`).join("")}</div>${s.chart ? '<canvas class="chart" aria-hidden="true"></canvas>' : ""}<p class="step-text">${s.text}</p>${facts}${slow}<div class="nav"><button class="btn ghost" data-act="prev" ${state.step ? "" : "disabled"} aria-label="Paso anterior">${icon("back")}</button><button class="btn" data-act="next">${state.step === n - 1 ? "Terminar" : "Siguiente"}${icon("next")}</button></div>`;
  }
  function rhythmsHtml() {
    return `<div class="head"><button class="round" data-act="list" aria-label="Volver a los procesos">${icon("back")}</button><h2><span class="sub">ECG en vivo</span>Ritmos del monitor</h2></div><p class="muted" style="font-size:13.5px">Elige un ritmo: cambian el trazo, la frecuencia y cómo late el corazón. La curva azul es la pletismografía: sin contracción eficaz no hay pulso.</p><div class="rh">${D.rhythms.map((r) => `<button data-rh="${r.id}" aria-pressed="${state.rhythmId === r.id}"><b>${esc(r.name)}<span>${esc(r.rate)}</span></b><p>${esc(r.text)}</p></button>`).join("")}</div><p class="foot">Dosis y algoritmos según ACLS/AHA; confirma con tu guía vigente.</p>`;
  }

  function applyStep() {
    const p = D.processes.find((x) => x.id === state.id);
    const s = p.steps[state.step];
    Stage.scene({ ...(p.base || {}), ...(s.scene || {}), fx: { ...(p.base?.fx || {}), ...(s.scene?.fx || {}) }, title: p.title });
    Physio.set({ ...Physio.NORMAL, ...(p.vitals || {}), ...(s.vitals || {}) });
    Physio.speed = s.slow || 1;
    Monitor.show(p.monitor !== false);
    Sheet.html(stepHtml());
    Sheet.atLeast("mid");
    chart = $(".chart", Sheet.view);
    state.autoAt = performance.now();
    $("[data-hint]").textContent = s.hint || "Gira el cuerpo para verlo desde otro lado";
  }
  function open(id) {
    state.id = id;
    state.step = 0;
    state.rhythm = false;
    applyStep();
  }
  function showList() {
    state.id = null;
    state.rhythm = false;
    state.auto = false;
    chart = null;
    Physio.speed = 1;
    Physio.reset();
    Stage.endScene();
    Stage.home();
    Monitor.show(false);
    Sheet.html(listHtml());
    Sheet.set("mid");
    $("[data-hint]").textContent = "Elige un proceso";
  }
  function showRhythms() {
    state.id = null;
    state.rhythm = true;
    state.rhythmId = "sinusal";
    Stage.scene({ only: ["corazon", "cor-izq", "cor-da", "cor-cx", "cor-der", "venas-cardiacas", "aorta", "vcs", "vci", "carotidas", "subclavias"], focus: "corazon", zoom: 6.4, turn: -0.3, title: "Ritmos del monitor" });
    Monitor.show(true);
    Sheet.html(rhythmsHtml());
    Sheet.set("mid");
    $("[data-hint]").textContent = "Mira cómo late con cada ritmo";
  }
  const RHYTHM_SET = { sinusal: { rhythm: "sinusal", hr: 72 }, taqui: { rhythm: "sinusal", hr: 125 }, bradi: { rhythm: "sinusal", hr: 45 }, fa: { rhythm: "fa", hr: 110, spo2: 96 }, flutter: { rhythm: "flutter", hr: 150 }, bav3: { rhythm: "bav3", hr: 38, sys: 96, dia: 54 }, tv: { rhythm: "tv", hr: 180, sys: 84, dia: 50, spo2: 88, perf: 0.5 }, fv: { rhythm: "fv", hr: 0, sys: 0, dia: 0, spo2: 0, perf: 0 } };

  function step(by) {
    const p = D.processes.find((x) => x.id === state.id);
    const next = state.step + by;
    if (next >= p.steps.length) {
      seen[p.id] = 1;
      store.set("processes", seen);
      Sheet.toast("Proceso completado", "good");
      showList();
      return;
    }
    state.step = clamp(next, 0, p.steps.length - 1);
    applyStep();
  }

  function bind() {
    Sheet.view.addEventListener("click", (e) => {
      if (Tabs.now !== "procesos") return;
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.open) open(b.dataset.open);
      else if (b.dataset.rhythms !== undefined) showRhythms();
      else if (b.dataset.act === "list") showList();
      else if (b.dataset.act === "next") { state.auto = false; step(1); }
      else if (b.dataset.act === "prev") { state.auto = false; step(-1); }
      else if (b.dataset.act === "auto") { state.auto = !state.auto; state.autoAt = performance.now(); Sheet.html(stepHtml(), { top: false }); chart = $(".chart", Sheet.view); }
      else if (b.dataset.rh) {
        state.rhythmId = b.dataset.rh;
        Physio.set({ ...Physio.NORMAL, ...RHYTHM_SET[b.dataset.rh] });
        Sheet.html(rhythmsHtml(), { top: false });
      }
    });
    Sheet.view.addEventListener("input", (e) => {
      if (Tabs.now !== "procesos" || !e.target.matches(".speed input")) return;
      Physio.speed = Number(e.target.value);
      $("[data-speed]", Sheet.view).textContent = `${Math.round(Physio.speed * 100)} %`;
    });
    bus.on("tap", ({ hit }) => {
      if (Tabs.now !== "procesos" || !hit || hit.id === "piel") return;
      Sheet.toast(Body.S[hit.id].info.name);
    });
    bus.emit("frame-hook", (t) => {
      if (Tabs.now !== "procesos" || !state.id) return;
      const s = current();
      if (s.chart) drawWiggers(t);
      if (s.anim && ANIM[s.anim] && !still.matches) ANIM[s.anim](t, s);
      if (state.auto && performance.now() - state.autoAt > (s.seconds || 9) * 1000) step(1);
    });
  }
  return { bind, enter: showList, leave() { Physio.speed = 1; chart = null; state.id = null; state.auto = false; }, root: showList, open(id) { Tabs.set("procesos", { silent: true }); open(id); } };
})();
