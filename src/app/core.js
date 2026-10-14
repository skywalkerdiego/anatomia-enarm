// ── Core: data, small helpers, storage, a tiny event bus ──
const D = window.__DATA__;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const still = matchMedia("(prefers-reduced-motion: reduce)");
const norm = (text) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem("enarm." + key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("enarm." + key, JSON.stringify(value));
    } catch {}
  },
};

// Which body to show: ?modelo= in the address, else the last one chosen, else the female body.
const MODEL = (() => {
  const asked = new URLSearchParams(location.search).get("modelo") || store.get("modelo", "mujer");
  return D.models[asked] ? asked : "hombre";
})();
D.body = D.models[MODEL];
D.bodyUrl = D.files[MODEL].url;
D.bodyGz = D.files[MODEL].size;
D.model = MODEL;

const bus = {
  handlers: {},
  on(name, fn) { (this.handlers[name] ??= []).push(fn); },
  emit(name, detail) { for (const fn of this.handlers[name] || []) fn(detail); },
};

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/** Small inline icons, drawn on a 20 px grid with the kit's line weight. */
const ICON = {
  body: '<path d="M10 2.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM6 8.4h8M10 6.4v6.2M10 12.6l-2.6 5M10 12.6l2.6 5M6 8.4l-1.4 4.4M14 8.4l1.4 4.4"/>',
  flow: '<path d="M3 10h3l2-5 3 10 2-7 1.4 2H17"/>',
  cases: '<path d="M4 6.5h12v9.5H4zM7.5 6.5V4.5h5v2M10 9.2v4M8 11.2h4"/>',
  quiz: '<path d="M7.6 7.6a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2.9-1.2 1.8M10 14.6v.2"/><circle cx="10" cy="10" r="7.2"/>',
  layers: '<path d="m10 3 7 3.6-7 3.6-7-3.6ZM3.6 10.2 10 13.6l6.4-3.4M3.6 13.4 10 16.8l6.4-3.4"/>',
  search: '<circle cx="9" cy="9" r="5"/><path d="m13 13 3.6 3.6"/>',
  close: '<path d="m5.5 5.5 9 9M14.5 5.5l-9 9"/>',
  back: '<path d="M12.5 4.5 7 10l5.5 5.5"/>',
  next: '<path d="M7.5 4.5 13 10l-5.5 5.5"/>',
  play: '<path d="M7 4.6v10.8l8.6-5.4Z"/>',
  pause: '<path d="M7 4.8v10.4M13 4.8v10.4"/>',
  theme: '<circle cx="10" cy="10" r="6.4"/><path d="M10 3.6a6.4 6.4 0 0 1 0 12.8Z" fill="currentColor"/>',
  sound: '<path d="M4 8.2v3.6h2.6l3.4 3V5.2l-3.4 3ZM13 7.4a3.6 3.6 0 0 1 0 5.2M15 5.4a6.4 6.4 0 0 1 0 9.2"/>',
  mute: '<path d="M4 8.2v3.6h2.6l3.4 3V5.2l-3.4 3ZM13 8l4 4M17 8l-4 4"/>',
  turn: '<path d="M4.2 10a5.8 5.8 0 0 1 10-4M15.8 10a5.8 5.8 0 0 1-10 4M14.4 3v3.2h-3.2M5.6 17v-3.2h3.2"/>',
  explode: '<path d="M10 3v3M10 14v3M3 10h3M14 10h3M5 5l2 2M13 13l2 2M15 5l-2 2M7 13l-2 2"/><circle cx="10" cy="10" r="1.6"/>',
  home: '<path d="M3.6 9.6 10 4l6.4 5.6M5.4 8.4v7.2h9.2V8.4"/>',
  check: '<path d="m4.6 10.4 3.4 3.4 7.4-7.6"/>',
  star: '<path d="m10 3 2.1 4.4 4.8.6-3.5 3.3.9 4.8L10 13.8l-4.3 2.3.9-4.8L3.1 8l4.8-.6Z"/>',
  more: '<circle cx="5" cy="10" r="1.1"/><circle cx="10" cy="10" r="1.1"/><circle cx="15" cy="10" r="1.1"/>',
  pin: '<path d="M10 17s5-4.6 5-8.6a5 5 0 0 0-10 0c0 4 5 8.6 5 8.6Z"/><circle cx="10" cy="8.4" r="1.8"/>',
  heart: '<path d="M10 16.4S3.6 12.6 3.6 8.2A3.4 3.4 0 0 1 10 6.6a3.4 3.4 0 0 1 6.4 1.6c0 4.4-6.4 8.2-6.4 8.2Z"/>',
  info: '<circle cx="10" cy="10" r="7.2"/><path d="M10 9v5M10 6.2v.2"/>',
};
const icon = (name) => `<svg class="ic" viewBox="0 0 20 20" aria-hidden="true">${ICON[name] || ""}</svg>`;
