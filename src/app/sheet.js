// ── Sheet: the bottom panel with three heights, the tab bar and the toast ──
const Sheet = (() => {
  const app = $(".app"), sheet = $(".sheet"), grab = $(".grab"), scroll = $(".sheet-scroll"), view = $(".view"), toastEl = $(".toast");
  const root = document.documentElement;
  const ORDER = ["peek", "mid", "full"];
  let snap = "peek", peek = 168, height = 168, safeT = 0, safeB = 0, drag = null, toastTimer = 0;

  function measure() {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden";
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    safeT = parseFloat(cs.height) || 0;
    safeB = parseFloat(cs.paddingBottom) || 0;
    probe.remove();
  }
  const tabH = () => 54 + safeB;
  const wide = () => innerWidth >= 760;
  const heights = () => ({ peek, mid: Math.round(innerHeight * 0.45), full: Math.max(peek + 40, innerHeight - safeT - 64 - tabH() - (wide() ? 32 : 0)) });

  function layout() {
    const mon = Monitor.shown ? 70 : 0;
    root.style.setProperty("--sheet-h", height + "px");
    root.style.setProperty("--mon-h", mon + "px");
    const cover = Math.min(height, innerHeight * 0.47);
    Body.view.inset = wide()
      ? { top: safeT + 40, right: 432, bottom: 20, left: 60 }
      : { top: safeT + 38, right: 58, bottom: tabH() + cover + mon + 30, left: 10 };
  }
  function set(name, { peekHeight } = {}) {
    if (peekHeight) peek = peekHeight;
    snap = name;
    height = heights()[snap];
    sheet.dataset.snap = snap;
    app.dataset.sheet = snap;
    layout();
  }
  /** At least this tall (never shrinks a sheet the reader opened wider). */
  function atLeast(name) {
    if (ORDER.indexOf(snap) < ORDER.indexOf(name)) set(name);
  }

  function bindDrag(target) {
    target.addEventListener("pointerdown", (e) => {
      // The handle always drags; the content drags by its header, or anywhere while the sheet is at its lowest.
      if (target !== grab && (e.target.closest("button,input,a,canvas") || !(snap === "peek" || e.target.closest(".head")))) return;
      drag = { y: e.clientY, h: height, t: performance.now(), moved: 0, id: e.pointerId, last: e.clientY, v: 0 };
    });
  }
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dy));
    if (drag.moved < 5) return;
    app.setAttribute("data-dragging", "");
    const h = heights();
    drag.v = e.clientY - drag.last;
    drag.last = e.clientY;
    height = clamp(drag.h - dy, h.peek - 30, h.full + 20);
    sheet.dataset.snap = "mid";
    layout();
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    app.removeAttribute("data-dragging");
    const h = heights();
    if (d.moved < 5) {
      if (e.target.closest(".grab")) set(ORDER[(ORDER.indexOf(snap) + 1) % 3]);
      return;
    }
    const aim = height - d.v * 14;
    let best = "peek";
    for (const name of ORDER) if (Math.abs(h[name] - aim) < Math.abs(h[best] - aim)) best = name;
    set(best);
  };
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  grab.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set(ORDER[(ORDER.indexOf(snap) + 1) % 3]); } });

  function html(markup, { top = true } = {}) {
    view.innerHTML = markup;
    if (top) scroll.scrollTop = 0;
  }
  function toast(text, tone = "") {
    toastEl.textContent = text;
    toastEl.dataset.tone = tone;
    toastEl.setAttribute("data-on", "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.removeAttribute("data-on"), 1900);
  }

  function init() {
    measure();
    bindDrag(grab);
    bindDrag(view);
    window.addEventListener("resize", () => { measure(); set(snap); });
    bus.on("layout", layout);
    set("peek");
  }
  return { init, set, atLeast, html, toast, layout, view, scroll, get snap() { return snap; }, get safeT() { return safeT; } };
})();
