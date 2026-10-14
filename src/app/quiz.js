// ── Review: exam-style questions, and "find it on the body" ──
const Quiz = (() => {
  const ALL = [];
  for (const [id, card] of Object.entries(D.cards)) (card.quiz || []).forEach((q, i) => ALL.push({ ...q, id: `${id}:${i}`, card: id }));
  const stats = store.get("stats", {});
  const state = { mode: store.get("review", "preguntas"), filter: "todo", card: null, q: null, picked: null, session: { ok: 0, n: 0 }, find: null, misses: 0, streak: 0, best: store.get("streak", 0), found: false };
  const structOf = (card) => Body.LIST.find((s) => s.info.card === card);
  const sysOfCard = (card) => structOf(card)?.info.sys;
  // Structures that can be reached by turning the body and switching layers.
  const FINDABLE = ["corazon", "pulmon-der-sup", "pulmon-der-med", "pulmon-der-inf", "pulmon-izq-sup", "pulmon-izq-inf", "traquea", "diafragma", "timo", "higado", "vesicula", "estomago", "bazo", "colon", "yeyuno", "ileon", "vejiga", "rinon-der", "rinon-izq", "aorta", "vci", "carotidas", "yugulares", "art-iliacas", "art-pulmonar", "craneo", "mandibula", "laringe", "claviculas", "escapulas", "humeros", "radios", "cubitos", "manos", "esternon", "costillas", "cartilagos", "col-cervical", "col-toracica", "col-lumbar", "sacro", "pelvis", "femures", "rotulas", "tibias", "perones", "pies", "cerebelo", "tronco", "lob-frontal", "lob-parietal", "lob-temporal", "lob-occipital", "giro-precentral", "giro-poscentral", "ojos", "genitales", "suprarrenales"];

  function pool() {
    if (state.filter === "falladas") return ALL.filter((q) => stats[q.id] && stats[q.id].last === 0);
    if (state.filter === "ficha") return ALL.filter((q) => q.card === state.card);
    if (state.filter === "todo") return ALL;
    return ALL.filter((q) => sysOfCard(q.card) === state.filter);
  }
  function nextQuestion() {
    const list = pool();
    state.picked = null;
    if (!list.length) { state.q = null; return; }
    const weight = (q) => { const s = stats[q.id]; return !s ? 3 : s.last === 0 ? 4 : 1; };
    let roll = list.reduce((a, q) => a + weight(q), 0) * Math.random();
    let q = list[0];
    for (const c of list) { roll -= weight(c); if (roll <= 0) { q = c; break; } }
    if (state.q && list.length > 1 && q.id === state.q.id) q = list[(list.indexOf(q) + 1) % list.length];
    state.q = { ...q, order: q.a.map((_, i) => i).sort(() => Math.random() - 0.5) };
    Stage.select(null, { quiet: true });
  }
  const head = () => `<div class="head"><h2><span class="sub">Repaso</span>${state.mode === "preguntas" ? "Preguntas tipo ENARM" : "Localiza en el cuerpo"}</h2></div><div class="seg" role="group" aria-label="Modo de repaso"><button data-mode="preguntas" aria-pressed="${state.mode === "preguntas"}">Preguntas</button><button data-mode="localiza" aria-pressed="${state.mode === "localiza"}">Localiza</button></div>`;
  function questionsHtml() {
    const mastered = ALL.filter((q) => stats[q.id]?.last === 1).length;
    const failed = ALL.filter((q) => stats[q.id]?.last === 0).length;
    const filters = [["todo", "Todo"], ...D.systems.map((s) => [s.id, s.name]), ["falladas", `Falladas (${failed})`]];
    if (state.card) filters.unshift(["ficha", D.cards[state.card].name]);
    const chips = filters.map(([id, name]) => `<button class="chip" data-filter="${id}" aria-pressed="${state.filter === id}">${esc(name)}</button>`).join("");
    const top = `${head()}<div class="score"><div><b>${state.session.ok}/${state.session.n}</b><span>esta sesión</span></div><div><b>${mastered}/${ALL.length}</b><span>dominadas</span></div></div><div class="chips" role="group" aria-label="Filtro">${chips}</div>`;
    const q = state.q;
    if (!q) return top + `<p class="muted">${state.filter === "falladas" ? "No tienes preguntas falladas." : "No hay preguntas con este filtro."}</p>`;
    const answered = state.picked !== null;
    const opts = q.order.map((i) => `<button class="opt" data-opt="${i}" ${answered ? "disabled" : ""} ${answered && i === q.ok ? 'data-state="ok"' : answered && i === state.picked ? 'data-state="bad"' : ""}>${esc(q.a[i])}</button>`).join("");
    const why = answered ? `<div class="why" ${state.picked === q.ok ? "data-ok" : "data-bad"}><b>${state.picked === q.ok ? "Correcto" : "Incorrecto"} · ${esc(D.cards[q.card].name)}</b>${esc(q.why)}</div><div class="actions"><button class="btn" data-act="next">Siguiente${icon("next")}</button><button class="btn ghost" data-act="card" data-card="${q.card}">Ver ficha</button></div>` : "";
    return `${top}<p class="q">${esc(q.q)}</p><div class="opts">${opts}</div>${why}`;
  }

  function nextFind() {
    const list = FINDABLE.filter((id) => !state.find || id !== state.find);
    state.find = list[Math.floor(Math.random() * list.length)];
    state.misses = 0;
    state.found = false;
    Stage.select(null, { quiet: true });
    Stage.home();
  }
  function findHtml() {
    const s = Body.S[state.find];
    const card = D.cards[s.info.card];
    const sys = D.systems.find((x) => x.id === s.info.sys);
    const span = Stage.levelSpan(s.meta.lo[2], s.meta.hi[2]);
    const hint = state.misses > 0 && !state.found ? `<p class="muted">Pista: ${esc(sys.name)}${span ? ` · nivel ${span}` : ""}. ${state.misses > 1 ? "Prueba a quitar capas con los botones de la derecha." : ""}</p>` : "";
    const after = state.found ? `<div class="pearl" style="text-align:left"><b>${esc(card ? card.name : s.info.name)}</b>${esc(card ? card.pearl : "")}</div>` : "";
    const buttons = state.found ? `<button class="btn" data-act="find-next">Siguiente${icon("next")}</button><button class="btn ghost" data-act="card" data-card="${s.info.card}">Ver ficha</button>` : `<button class="btn ghost" data-act="reveal">Mostrar</button><button class="btn ghost" data-act="find-next">Saltar</button>`;
    return `${head()}<div class="find"><span class="tag" data-tone="accent" style="float:right">Racha ${state.streak} · mejor ${state.best}</span><small>${state.found ? "Aquí está" : "Toca en el cuerpo"}</small><b>${esc(s.info.name)}</b>${hint}${after}</div><div class="actions">${buttons}</div>`;
  }
  function render({ top = true } = {}) {
    Sheet.html(state.mode === "preguntas" ? questionsHtml() : findHtml(), { top });
    $("[data-hint]").textContent = state.mode === "localiza" ? "Gira, acerca y quita capas para encontrarlo" : "El órgano de cada pregunta se ilumina al responder";
  }
  function setMode(mode) {
    state.mode = mode;
    store.set("review", mode);
    Stage.endScene();
    if (mode === "preguntas") { if (!state.q) nextQuestion(); Sheet.set("mid"); }
    else { if (!state.find) nextFind(); Sheet.set("peek", { peekHeight: 318 }); }
    render();
  }
  function reveal(found) {
    state.found = true;
    if (found) { state.streak++; if (state.streak > state.best) { state.best = state.streak; store.set("streak", state.best); } }
    else state.streak = 0;
    Stage.touch();
    Stage.select(state.find, { quiet: true });
    render();
  }

  function bind() {
    Sheet.view.addEventListener("click", (e) => {
      if (Tabs.now !== "repaso") return;
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.mode) setMode(b.dataset.mode);
      else if (b.dataset.filter) { state.filter = b.dataset.filter; nextQuestion(); render({ top: false }); }
      else if (b.dataset.act === "next") { nextQuestion(); render(); }
      else if (b.dataset.act === "card") Explore.openCard(b.dataset.card);
      else if (b.dataset.act === "find-next") { if (!state.found) state.streak = 0; nextFind(); render(); }
      else if (b.dataset.act === "reveal") reveal(false);
      else if (b.dataset.opt !== undefined && state.q && state.picked === null) {
        const q = state.q;
        state.picked = Number(b.dataset.opt);
        const ok = state.picked === q.ok ? 1 : 0;
        state.session.n++;
        state.session.ok += ok;
        const s = stats[q.id] || { n: 0, ok: 0 };
        s.n++; s.ok += ok; s.last = ok;
        stats[q.id] = s;
        store.set("stats", stats);
        const target = structOf(q.card);
        if (target) { Stage.touch(); Stage.select(target.id, { quiet: true }); }
        render({ top: false });
        requestAnimationFrame(() => $(".why", Sheet.view)?.scrollIntoView({ block: "nearest", behavior: still.matches ? "auto" : "smooth" }));
      }
    });
    bus.on("tap", ({ hit }) => {
      if (Tabs.now !== "repaso") return;
      if (state.mode !== "localiza") { if (hit && hit.id !== "piel") Sheet.toast(Body.S[hit.id].info.name); return; }
      if (state.found || !hit || hit.id === "piel") return;
      if (hit.id === state.find) { Sheet.toast("¡Correcto!", "good"); reveal(true); return; }
      state.misses++;
      state.streak = 0;
      Sheet.toast(`Eso es: ${Body.S[hit.id].info.name}`, "bad");
      render({ top: false });
    });
  }
  function enter() {
    Monitor.show(false);
    setMode(state.mode);
  }
  function startCard(card) {
    Tabs.set("repaso", { silent: true });
    Monitor.show(false);
    state.card = card;
    state.filter = "ficha";
    state.mode = "preguntas";
    nextQuestion();
    Sheet.set("mid");
    render();
  }
  return { bind, enter, leave() {}, root() { setMode(state.mode); }, startCard, get total() { return ALL.length; } };
})();
