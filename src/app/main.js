// ── Main: tabs, theme, the stage's buttons, start-up and the frame loop ──
const Tabs = (() => {
  const modes = { explorar: Explore, procesos: Processes, casos: Cases, repaso: Quiz };
  const buttons = $$(".tabbar button");
  let now = "explorar";
  function set(name, { silent = false } = {}) {
    if (name === now) { modes[now].root?.(); return; }
    modes[now].leave?.();
    Stage.endScene();
    Physio.reset();
    now = name;
    for (const b of buttons) b.setAttribute("aria-selected", String(b.dataset.tab === name));
    $("[data-fig]").textContent = `Fig ${Object.keys(modes).indexOf(name) + 1}`;
    if (!silent) modes[now].enter();
  }
  for (const b of buttons) b.addEventListener("click", () => set(b.dataset.tab));
  return { set, modes, get now() { return now; } };
})();

const Theme = (() => {
  let theme = store.get("theme", null) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  function apply() {
    const dark = theme === "dark";
    document.body.dataset.theme = theme;
    Body.look.dark = dark;
    Body.look.accent = dark ? [1, 0.62, 0.16] : [0.95, 0.5, 0.05];
    Body.setStudio(dark);
    $('meta[name="theme-color"]').content = dark ? "#0b0b0b" : "#f2f2ef";
  }
  function toggle() {
    theme = theme === "dark" ? "light" : "dark";
    store.set("theme", theme);
    apply();
  }
  return { apply, toggle };
})();

(function start() {
  const app = $(".app");
  const loading = $(".loading");
  const bar = $(".loading u");
  const note = $("[data-loading]");
  const hooks = [];
  bus.on("frame-hook", (fn) => hooks.push(fn));

  note.textContent = D.model === "mujer" ? "Cargando el cuerpo femenino…" : "Cargando el cuerpo masculino…";
  Sheet.init();
  Monitor.init();
  const ok = Body.init($(".gl"));
  Theme.apply();

  // Layer switches and view tools.
  const DOT = { piel: "#E7B99C", musculo: "#A93C33", hueso: "#E8DFCA", organo: "#C9706B", vaso: "#3E62C6", nervio: "#F3D57A" };
  $(".rail").innerHTML = D.layers.map((l) => `<button type="button" data-layer="${l.id}" aria-pressed="true" aria-label="Capa: ${l.name}"><i style="--dot:${DOT[l.id]}"></i>${l.short}</button>`).join("");
  $(".tools").innerHTML = [["home", "home", "Ver el cuerpo completo"], ["flip", "turn", "Girar media vuelta"], ["explode", "explode", "Separar las piezas"], ["theme", "theme", "Tema claro u oscuro"]]
    .map(([act, glyph, label]) => `<button type="button" data-tool="${act}" aria-label="${label}" title="${label}">${icon(glyph)}</button>`).join("");
  // The two bodies: switching loads the other model (it stays cached for next time).
  const sexes = $(".sex");
  sexes.innerHTML = [["mujer", "Mujer"], ["hombre", "Hombre"]].map(([id, name]) => `<button type="button" data-model="${id}" aria-pressed="${D.model === id}">${name}</button>`).join("");
  sexes.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-model]");
    if (!b || b.dataset.model === D.model) return;
    store.set("modelo", b.dataset.model);
    const url = new URL(location.href);
    url.searchParams.delete("modelo");
    $(".loading").removeAttribute("data-done");
    $("[data-loading]").textContent = b.dataset.model === "mujer" ? "Cargando el cuerpo femenino…" : "Cargando el cuerpo masculino…";
    setTimeout(() => location.replace(url), 60);
  });
  $(".rail").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-layer]");
    if (b) Stage.setLayer(b.dataset.layer, b.getAttribute("aria-pressed") !== "true");
  });
  $(".tools").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tool]");
    if (!b) return;
    Stage.touch();
    if (b.dataset.tool === "home") { Stage.home(); }
    else if (b.dataset.tool === "flip") Body.view.turnTo += Math.PI;
    else if (b.dataset.tool === "theme") Theme.toggle();
    else if (b.dataset.tool === "explode") {
      const on = Body.look.explodeTo < 0.5;
      Body.look.explodeTo = on ? 1 : 0;
      b.setAttribute("aria-pressed", String(on));
      if (on) Body.view.zoomTo = Math.min(Body.view.zoomTo, 0.82);
      else if (Body.view.zoomTo < 1) Body.view.zoomTo = 1;
    }
  });

  if (!ok) {
    note.innerHTML = `Este navegador no puede dibujar el modelo 3D (${esc(Body.failed)}).<br><a href="torso.html" style="color:inherit">Abrir la maqueta del torso en su lugar</a>`;
    return;
  }
  Stage.init();
  for (const mode of Object.values(Tabs.modes)) mode.bind?.();
  Tabs.modes.explorar.enter();

  let last = 0, frame = 0;
  function tick(ms) {
    const dt = last ? Math.min(0.05, (ms - last) / 1000) : 1 / 60;
    last = ms;
    const t = Physio.tick(dt * Physio.speed);
    Stage.frame(t, dt);
    Body.render(t, dt);
    Monitor.frame(t);
    for (const fn of hooks) fn(t, dt);
    frame = document.hidden ? 0 : requestAnimationFrame(tick);
  }
  const kick = () => { if (!frame && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); } };
  document.addEventListener("visibilitychange", kick);
  kick();

  Body.load((p) => { bar.style.width = `${Math.round(p * 100)}%`; })
    .then(() => { Body.settle(); loading.setAttribute("data-done", ""); app.removeAttribute("data-busy"); })
    .catch((error) => { note.innerHTML = `${esc(error.message || error)}<br><button class="btn" style="margin-top:12px" onclick="location.reload()">Reintentar</button>`; });

  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js");
  window.__app = { Body, Stage, Physio, Tabs, Sheet, Monitor, Cases, Processes };
})();
