// ── Explore: find a structure, tap it on the body, read its card ──
const Explore = (() => {
  const state = { query: "", sys: "", isolated: false };
  const PEEK = 114;
  const ORD_ES = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };

  /** A readable Spanish name for the part that was tapped, when the part is worth naming. */
  function partName(id, index) {
    const p = Body.S[id]?.meta.parts[index];
    if (!p || Body.S[id].meta.parts.length < 2) return "";
    const n = p.n;
    let m;
    if (n === "atlas") return "C1 (atlas)";
    if (n === "axis") return "C2 (axis)";
    if ((m = n.match(/^(\w+) (cervical|thoracic|lumbar) vertebra$/))) return `${{ cervical: "C", thoracic: "T", lumbar: "L" }[m[2]]}${ORD_ES[m[1]]}`;
    if ((m = n.match(/^intervertebral disk of (\w+) (cervical|thoracic|lumbar) vertebra$/))) return `Disco bajo ${{ cervical: "C", thoracic: "T", lumbar: "L" }[m[2]]}${ORD_ES[m[1]]}`;
    if ((m = n.match(/^(left|right) (\w+) rib$/))) return `${ORD_ES[m[2]]}.ª costilla ${m[1] === "left" ? "izquierda" : "derecha"}`;
    const side = /\bleft\b/.test(n) ? "izquierdo" : /\bright\b/.test(n) ? "derecho" : "";
    const NAMES = { "frontal bone": "Hueso frontal", "occipital bone": "Hueso occipital", "sphenoid bone": "Esfenoides", ethmoid: "Etmoides", vomer: "Vómer", manubrium: "Manubrio", "body of sternum": "Cuerpo del esternón", "xiphoid process": "Apófisis xifoides", "ascending aorta": "Aorta ascendente", "arch of aorta": "Cayado aórtico", "descending aorta": "Aorta descendente", "celiac artery": "Tronco celiaco", "common hepatic artery": "Arteria hepática común", "splenic artery": "Arteria esplénica", "left gastric artery": "Arteria gástrica izquierda", "superior mesenteric artery": "Mesentérica superior", "inferior mesenteric artery": "Mesentérica inferior", "superior vena cava": "Vena cava superior", "splenic vein": "Vena esplénica", "superior mesenteric vein": "Vena mesentérica superior", "mitral valve": "Válvula mitral", "tricuspid valve": "Válvula tricúspide", "pulmonary valve": "Válvula pulmonar", "thyroid cartilage": "Cartílago tiroides", "hyoid bone": "Hueso hioides", pons: "Puente", "medulla oblongata": "Bulbo raquídeo", "midbrain, nsn": "Mesencéfalo", "peduncle of midbrain": "Pedúnculos cerebrales", "third ventricle": "Tercer ventrículo", "fourth ventricle": "Cuarto ventrículo", "cerebral aqueduct": "Acueducto de Silvio", "optic chiasm": "Quiasma óptico", eyeball: "Globos oculares", "corpus callosum": "Cuerpo calloso", prostate: "Próstata", urethra: "Uretra", "glans penis": "Glande", "brachiocephalic artery, nsn": "Tronco braquiocefálico", "pancreatic duct": "Conducto de Wirsung", "stem of left coronary artery": "Tronco coronario izquierdo", "coronary sinus": "Seno coronario", "great cardiac vein": "Vena cardiaca magna", "middle cardiac vein": "Vena cardiaca media" };
    if (NAMES[n]) return NAMES[n];
    const BONES = { parietal: "Parietal", temporal: "Temporal", zygomatic: "Cigomático", nasal: "Hueso nasal", lacrimal: "Lagrimal", palatine: "Palatino", maxilla: "Maxilar", clavicle: "Clavícula", scapula: "Escápula", humerus: "Húmero", radius: "Radio", ulna: "Cúbito", femur: "Fémur", patella: "Rótula", tibia: "Tibia", fibula: "Peroné", "hip bone": "Coxal", talus: "Astrágalo", calcaneus: "Calcáneo", scaphoid: "Escafoides", lunate: "Semilunar", kidney: "Riñón", ureter: "Uréter", "adrenal gland": "Suprarrenal", testis: "Testículo", "common carotid artery": "Carótida común", "subclavian artery": "Arteria subclavia", "renal artery": "Arteria renal", "renal vein": "Vena renal", "internal jugular vein": "Yugular interna", "subclavian vein": "Vena subclavia", "brachiocephalic vein": "Vena braquiocefálica", "common iliac artery": "Ilíaca común", "external iliac artery": "Ilíaca externa", "internal iliac artery": "Ilíaca interna", "common iliac vein": "Vena ilíaca común", "external iliac vein": "Vena ilíaca externa", "internal iliac vein": "Vena ilíaca interna", thalamus: "Tálamo", putamen: "Putamen", "caudate nucleus": "Núcleo caudado", "globus pallidus": "Globo pálido", hippocampus: "Hipocampo", amygdala: "Amígdala", "lateral ventricle": "Ventrículo lateral", "optic nerve": "Nervio óptico", "optic tract": "Cintilla óptica", "precentral gyrus": "Giro precentral", "postcentral gyrus": "Giro poscentral", "occipital lobe": "Lóbulo occipital", insula: "Ínsula", "cingulate gyrus": "Giro del cíngulo" };
    for (const [key, name] of Object.entries(BONES)) if (n.endsWith(key)) return side ? `${name} ${/a$/.test(name.split(" ")[0]) ? side.replace(/o$/, "a") : side}` : name;
    return "";
  }

  const visible = () => {
    const q = norm(state.query.trim());
    return Body.LIST.filter((s) => s.id !== "piel" && (!state.sys || s.info.sys === state.sys) && (!q || norm(`${s.info.name} ${s.info.short} ${D.cards[s.info.card]?.name || ""}`).includes(q)));
  };
  const rowOf = (s) => {
    const span = Stage.levelSpan(s.meta.lo[2], s.meta.hi[2]);
    const card = D.cards[s.info.card];
    return `<button class="row" data-pick="${s.id}"><i class="dot" style="--dot:${s.info.hex}"></i><span><b>${esc(s.info.name)}</b><small>${esc(span ? `Nivel ${span}` : card ? card.level : "")}</small></span>${icon("next").replace('class="ic"', 'class="ic go"')}</button>`;
  };
  function listHtml() {
    const chips = [`<button class="chip" data-sys="" aria-pressed="${!state.sys}">Todo</button>`, ...D.systems.map((s) => `<button class="chip" data-sys="${s.id}" aria-pressed="${state.sys === s.id}">${esc(s.name)}</button>`)].join("");
    const list = visible();
    let rows;
    if (!list.length) rows = `<p class="muted" style="padding:14px 8px">Nada coincide con «${esc(state.query)}».</p>`;
    else if (state.query || state.sys) rows = list.map(rowOf).join("");
    else rows = D.systems.map((sys) => `<h3 style="padding:0 8px">${esc(sys.name)}</h3>` + list.filter((s) => s.info.sys === sys.id).map(rowOf).join("")).join("");
    const fact = D.facts[Math.floor(Date.now() / 60000) % D.facts.length];
    return `<div class="head"><label class="search">${icon("search")}<input type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Buscar: bazo, T10, coronaria…" value="${esc(state.query)}" aria-label="Buscar estructura"></label></div><div class="chips" role="group" aria-label="Sistemas">${chips}</div><div class="pearl" style="margin-top:12px"><b>Dato curioso</b>${esc(fact)}</div><div class="rows">${rows}</div><p class="foot">Modelo: BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 JP), procesado con Blender. Es un cuerpo masculino adulto: no incluye útero, ovarios ni mama. Material de estudio: confirma siempre con tu bibliografía y las guías vigentes.</p><p class="foot"><a href="torso.html" style="color:inherit">Maqueta isométrica del torso (versión anterior)</a></p>`;
  }
  function cardHtml(id) {
    const s = Body.S[id];
    const card = D.cards[s.info.card];
    const sys = D.systems.find((x) => x.id === s.info.sys);
    const span = Stage.levelSpan(s.meta.lo[2], s.meta.hi[2]);
    const piece = partName(id, Stage.part);
    const tags = [span && `<span class="tag" data-tone="accent">Nivel ${span}</span>`, piece && `<span class="tag">${esc(piece)}</span>`, card && `<span class="tag">${esc(card.level)}</span>`].filter(Boolean).join("");
    const head = `<div class="head"><button class="round" data-act="back" aria-label="Volver a la lista">${icon("back")}</button><h2><span class="sub">${esc(sys ? sys.name : "")}</span>${esc(s.info.name)}</h2><button class="round" data-act="isolate" aria-pressed="${state.isolated}" aria-label="Aislar esta estructura" title="Aislar">${icon("layers")}</button></div>`;
    if (!card) return head + `<div class="tagline">${tags}</div>`;
    const also = card.name !== s.info.name ? `<p class="muted" style="font-size:13px">Ficha: ${esc(card.name)}</p>` : "";
    const related = D.cases.filter((c) => (c.organs || []).includes(s.info.card)).map((c) => `<button class="chip" data-case="${c.id}">${icon("cases")}${esc(c.title)}</button>`).join("");
    return `${head}<div class="tagline">${tags}</div>${also}${card.sections.map(([h, items]) => `<h3>${esc(h)}</h3><ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`).join("")}<div class="pearl"><b>Perla ENARM</b>${esc(card.pearl)}</div>${related ? `<h3>Casos para practicar</h3><div class="chips" style="margin-top:0">${related}</div>` : ""}<div class="actions">${card.quiz?.length ? `<button class="btn" data-act="quiz" data-card="${s.info.card}">Preguntas (${card.quiz.length})</button>` : ""}<button class="btn ghost" data-act="back">Lista</button></div>`;
  }

  function render({ keepInput = false } = {}) {
    const id = Stage.selected;
    if (id && id !== "piel") {
      Sheet.html(cardHtml(id));
      Sheet.atLeast("mid");
      $("[data-hint]").textContent = "Toca fuera para soltar";
      return;
    }
    if (keepInput) {
      $(".rows", Sheet.view).innerHTML = (() => { const tmp = document.createElement("div"); tmp.innerHTML = listHtml(); return $(".rows", tmp).innerHTML; })();
      $$(".chip[data-sys]", Sheet.view).forEach((c) => c.setAttribute("aria-pressed", String((c.dataset.sys || "") === state.sys)));
    } else Sheet.html(listHtml());
    $("[data-hint]").textContent = "Arrastra para girar · toca un órgano";
  }
  function isolate(on) {
    state.isolated = on;
    const id = Stage.selected;
    if (on && id) Stage.scene({ only: [id], select: id, reset: false });
    else { const keep = Stage.selected; Stage.endScene(); if (keep) Stage.select(keep, { quiet: true, focus: false }); }
    render();
  }

  function bind() {
    Sheet.view.addEventListener("input", (e) => {
      if (Tabs.now !== "explorar" || !e.target.matches(".search input")) return;
      state.query = e.target.value;
      render({ keepInput: true });
      if (state.query) Sheet.atLeast("mid");
    });
    Sheet.view.addEventListener("focusin", (e) => { if (Tabs.now === "explorar" && e.target.matches(".search input")) Sheet.atLeast("mid"); });
    Sheet.view.addEventListener("click", (e) => {
      if (Tabs.now !== "explorar") return;
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.sys !== undefined) { state.sys = b.dataset.sys; render({ keepInput: true }); Sheet.atLeast("mid"); }
      else if (b.dataset.pick) { Stage.touch(); Stage.select(b.dataset.pick); }
      else if (b.dataset.act === "back") { if (state.isolated) isolate(false); Stage.select(null); Stage.home(); Sheet.set("mid"); }
      else if (b.dataset.act === "isolate") isolate(!state.isolated);
      else if (b.dataset.act === "quiz") { Quiz.startCard(b.dataset.card); }
      else if (b.dataset.case) Cases.open(b.dataset.case);
    });
    bus.on("tap", ({ hit }) => {
      if (Tabs.now !== "explorar") return;
      if (state.isolated && (!hit || hit.id !== Stage.selected)) isolate(false);
      if (!hit || hit.id === "piel") { Stage.select(null); if (Sheet.snap !== "peek") Sheet.set("peek", { peekHeight: PEEK }); return; }
      Stage.select(hit.id, { partIndex: hit.part });
    });
    bus.on("select", () => { if (Tabs.now === "explorar") render(); });
  }
  function enter() {
    Monitor.show(false);
    Sheet.set(Stage.selected ? "mid" : "peek", { peekHeight: PEEK });
    render();
  }
  function leave() {
    if (state.isolated) isolate(false);
    Stage.select(null, { quiet: true });
  }
  function root() {
    if (state.isolated) isolate(false);
    Stage.select(null);
    Stage.home();
    state.query = "";
    state.sys = "";
    Sheet.set("peek", { peekHeight: PEEK });
    render();
  }
  /** Open the card from another mode: go to the explorer with its first structure selected. */
  function openCard(card) {
    const s = Body.LIST.find((x) => x.info.card === card);
    Tabs.set("explorar", { silent: true });
    Monitor.show(false);
    Sheet.set("mid", { peekHeight: PEEK });
    if (s) { Stage.touch(); Stage.select(s.id); }
    else render();
  }
  return { bind, enter, leave, root, render, partName, openCard };
})();
