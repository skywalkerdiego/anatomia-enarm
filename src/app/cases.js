// ── Cases: a patient on the stand ──
// A case is a vignette, then a chain of nodes: questions (a decision with feedback) and frames
// that show on the body what the disease is doing. The monitor and the model follow every node.
const Cases = (() => {
  const state = { id: null, node: -1, picked: null, order: [], right: 0, asked: 0, area: "" };
  const done = store.get("cases", {});
  const stars = (n, cls = "stars") => `<span class="${cls}" aria-label="${n} de 3 estrellas">${[1, 2, 3].map((i) => icon("star").replace('class="ic"', `class="ic"${i <= n ? " data-on" : ""}`)).join("")}</span>`;
  // Cases written for one body only appear with it.
  const CASES = D.cases.filter((c) => !c.model || c.model === D.model);
  const theCase = () => CASES.find((c) => c.id === state.id);

  function listHtml() {
    const areas = [...new Set(CASES.map((c) => c.area))];
    const solved = CASES.filter((c) => done[c.id]).length;
    const total = CASES.reduce((n, c) => n + (done[c.id]?.stars || 0), 0);
    const chips = [`<button class="chip" data-area="" aria-pressed="${!state.area}">Todos</button>`, ...areas.map((a) => `<button class="chip" data-area="${esc(a)}" aria-pressed="${state.area === a}">${esc(a)}</button>`)].join("");
    const rows = CASES.filter((c) => !state.area || c.area === state.area).map((c) => `<button class="case-row" data-open="${c.id}" style="--hue:${c.hue}"><span class="glyph">${icon(c.glyph || "cases")}</span><span><b>${esc(c.title)}</b><small>${esc(c.area)} · ${"●".repeat(c.level)}${"○".repeat(3 - c.level)} · ${c.nodes.filter((n) => n.q).length} decisiones</small></span>${done[c.id] ? stars(done[c.id].stars) : ""}</button>`).join("");
    return `<div class="head"><h2><span class="sub">Simulador</span>Casos clínicos</h2></div><div class="score"><div><b>${solved}/${CASES.length}</b><span>casos resueltos</span></div><div><b>${total}/${CASES.length * 3}</b><span>estrellas</span></div></div><div class="chips" role="group" aria-label="Especialidad">${chips}</div>${rows}<p class="foot">Los casos son escenarios de estudio. Las conductas siguen las guías de práctica clínica y los cursos ATLS y ACLS; confirma dosis y tiempos con la versión vigente.</p>`;
  }
  const headHtml = (c, sub, title) => `<div class="head"><button class="round" data-act="list" aria-label="Salir del caso">${icon("close")}</button><h2><span class="sub">${esc(sub)}</span>${esc(title)}</h2></div>`;
  const dots = (c) => `<div class="steps">${c.nodes.map((_, i) => `<i ${i < state.node ? "data-done" : i === state.node ? "data-now" : ""}></i>`).join("")}</div>`;
  function introHtml(c) {
    const exam = c.intro.exam ? `<h3>Exploración</h3><ul>${c.intro.exam.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
    const labs = c.intro.labs ? `<div class="keyfacts">${c.intro.labs.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : "";
    return `${headHtml(c, c.area, c.title)}<div class="tagline"><span class="tag" data-tone="accent">${esc(c.patient)}</span></div><p class="vignette">${esc(c.intro.text)}</p>${exam}${labs}<div class="nav"><button class="btn" data-act="go">Atender al paciente${icon("next")}</button></div>`;
  }
  function nodeHtml(c) {
    const n = c.nodes[state.node];
    const head = headHtml(c, `${c.title} · ${state.node + 1} de ${c.nodes.length}`, n.q ? "¿Qué haces?" : n.title) + dots(c);
    if (!n.q) {
      const facts = n.facts ? `<div class="keyfacts">${n.facts.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : "";
      return `${head}<p class="step-text">${n.text}</p>${facts}<div class="nav"><button class="btn" data-act="next">Continuar${icon("next")}</button></div>`;
    }
    const answered = state.picked !== null;
    const opts = state.order.map((i) => {
      const mark = answered ? (i === n.ok ? "ok" : i === state.picked ? "bad" : "") : "";
      return `<button class="opt" data-opt="${i}" ${answered ? "disabled" : ""} ${mark ? `data-state="${mark}"` : ""}>${esc(n.options[i])}</button>`;
    }).join("");
    const why = answered ? `<div class="why" ${state.picked === n.ok ? "data-ok" : "data-bad"}><b>${state.picked === n.ok ? "Correcto" : "No era esa"}</b>${esc(n.why)}</div><div class="nav"><button class="btn" data-act="next">Continuar${icon("next")}</button></div>` : "";
    const lead = n.lead ? `<p class="step-text">${n.lead}</p>` : "";
    return `${head}${lead}<p class="q">${esc(n.q)}</p><div class="opts">${opts}</div>${why}`;
  }
  function summaryHtml(c) {
    const score = state.asked ? state.right / state.asked : 1;
    const got = score === 1 ? 3 : score >= 0.6 ? 2 : 1;
    const cards = (c.organs || []).map((id) => `<button class="chip" data-card="${id}">${icon("body")}${esc(D.cards[id].name)}</button>`).join("");
    return `${headHtml(c, c.area, c.title)}${stars(got, "bigstars")}<div class="score"><div><b>${state.right}/${state.asked}</b><span>decisiones correctas al primer intento</span></div></div><h3>Para llevarte</h3><ul>${c.pearls.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${cards ? `<h3>Repasa la anatomía</h3><div class="chips" style="margin-top:0">${cards}</div>` : ""}<div class="actions"><button class="btn" data-act="list">Otro caso</button><button class="btn ghost" data-act="again">Repetir</button></div>`;
  }

  function show() {
    const c = theCase();
    const n = state.node < 0 ? c.intro : state.node >= c.nodes.length ? null : c.nodes[state.node];
    if (n) {
      // A question keeps the scene before it; its `after` plays once it is answered.
      if (n.scene) Stage.scene({ ...(c.base || {}), ...n.scene, fx: { ...(c.base?.fx || {}), ...(n.scene.fx || {}) }, title: c.title });
      if (n.vitals) Physio.set(n.vitals);
    }
    Sheet.html(state.node < 0 ? introHtml(c) : n ? nodeHtml(c) : summaryHtml(c));
    Sheet.atLeast("mid");
  }
  function open(id) {
    const c = CASES.find((x) => x.id === id);
    if (!c) return;
    Object.assign(state, { id, node: -1, picked: null, right: 0, asked: 0 });
    Physio.set({ ...Physio.NORMAL, ...c.intro.vitals }, { instant: true });
    Stage.scene({ ...(c.base || {}), ...(c.intro.scene || {}), title: c.title });
    Monitor.show(true);
    show();
    $("[data-hint]").textContent = c.patient;
  }
  function advance() {
    const c = theCase();
    state.node++;
    state.picked = null;
    const n = c.nodes[state.node];
    if (n?.q) state.order = n.options.map((_, i) => i).sort(() => Math.random() - 0.5);
    if (state.node >= c.nodes.length) {
      const score = state.asked ? state.right / state.asked : 1;
      const got = score === 1 ? 3 : score >= 0.6 ? 2 : 1;
      done[c.id] = { stars: Math.max(got, done[c.id]?.stars || 0) };
      store.set("cases", done);
    }
    show();
  }
  function pick(index) {
    const c = theCase();
    const n = c.nodes[state.node];
    state.picked = index;
    state.asked++;
    const ok = index === n.ok;
    if (ok) state.right++;
    Sheet.toast(ok ? "Correcto" : "Revisa la explicación", ok ? "good" : "bad");
    if (n.after) {
      if (n.after.scene) Stage.scene({ ...(c.base || {}), ...n.after.scene, fx: { ...(c.base?.fx || {}), ...(n.after.scene.fx || {}) }, title: c.title });
      if (n.after.vitals) Physio.set(n.after.vitals);
    }
    Sheet.html(nodeHtml(c), { top: false });
    requestAnimationFrame(() => $(".why", Sheet.view)?.scrollIntoView({ block: "nearest", behavior: still.matches ? "auto" : "smooth" }));
  }
  function showList() {
    state.id = null;
    Physio.reset();
    Stage.endScene();
    Stage.home();
    Monitor.show(false);
    Sheet.html(listHtml());
    Sheet.set("mid");
    $("[data-hint]").textContent = "Elige un paciente";
  }

  function bind() {
    Sheet.view.addEventListener("click", (e) => {
      if (Tabs.now !== "casos") return;
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.open) open(b.dataset.open);
      else if (b.dataset.area !== undefined) { state.area = b.dataset.area; Sheet.html(listHtml(), { top: false }); }
      else if (b.dataset.act === "list") showList();
      else if (b.dataset.act === "go" || b.dataset.act === "next") advance();
      else if (b.dataset.act === "again") open(state.id);
      else if (b.dataset.opt !== undefined && state.picked === null) pick(Number(b.dataset.opt));
      else if (b.dataset.card) Explore.openCard(b.dataset.card);
    });
    bus.on("tap", ({ hit }) => {
      if (Tabs.now !== "casos" || !hit || hit.id === "piel") return;
      Sheet.toast(Body.S[hit.id].info.name);
    });
  }
  return { bind, enter: showList, leave() { state.id = null; }, root: showList, open(id) { Tabs.set("casos", { silent: true }); open(id); } };
})();
