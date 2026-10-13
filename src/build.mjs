import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { k, G, A } from "./geo.mjs";
import { W, H, projection, build, HEART, LUNGS, LEVELS, levelZ } from "./torso.mjs";
import { PIECES, SYSTEMS, RHYTHMS } from "./content.mjs";

const FAST = process.argv.includes("--fast");
const REUSE = process.argv.includes("--reuse");
const ROOT = new URL("../", import.meta.url);
const CACHE = new URL(".cache/figure.json", ROOT);
const t0 = Date.now();
const cached = REUSE ? JSON.parse(readFileSync(CACHE, "utf8")) : null;
const P = projection();
const { R, back, anchors } = cached ? { R: { items: [] }, back: [], anchors: {} } : build(P);
if (!FAST && !cached) A.settle(R, P, { states: [0] });

// Which pieces cover each piece (measured where two items overlap on screen).
const occluders = {};
if (R.settled) {
  const items = R.settled.items;
  for (const pair of R.settled.overlaps.pairs) {
    const a = items[pair.a];
    const b = items[pair.b];
    if (!a.piece || !b.piece || a.piece === b.piece) continue;
    if (pair.front[0].area >= 6) (occluders[b.piece] ??= new Set()).add(a.piece);
    if (pair.front[1].area >= 6) (occluders[a.piece] ??= new Set()).add(b.piece);
  }
}
const OCCL = cached ? cached.occluders : Object.fromEntries(Object.entries(occluders).map(([id, set]) => [id, [...set].filter((p) => p !== "soporte")]));

R.items.sort((a, b) => a.key - b.key);
const DOWN = { diafragma: "down", higado: "down2", vesicula: "down2", estomago: "down2", bazo: "down2" };
const motionOf = (item) => {
  if (item.name === "corazon.organ") return "beat";
  if (item.name === "pulmon-der.organ" || item.name === "pulmon-izq.organ") return "lung";
  return DOWN[item.piece] ?? "";
};
const groups = R.items.map((item) => {
  const m = motionOf(item);
  return `<g class="it" data-p="${item.piece}"${m ? ` data-m="${m}"` : ""}>${item.svg}</g>`;
}).join("");
const at = (p) => k.iso(p, P).map((v) => +v.toFixed(2));
const unit = (v) => {
  const o = k.iso([0, 0, 0], P);
  const p = k.iso(v, P);
  return [+(p[0] - o[0]).toFixed(4), +(p[1] - o[1]).toFixed(4)];
};

const LABEL =
  "Modelo anatómico de torso sobre un pedestal: columna vertebral, costillas posteriores, pulmones, corazón con grandes vasos, diafragma, hígado, vesícula, estómago, duodeno, páncreas, bazo, intestinos, riñones, vejiga y pelvis. Toca un órgano para estudiarlo.";
const figure = cached ? cached.figure : `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg fig-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${LABEL}"><g class="fig-back">${back.join("")}</g><g class="fig-items">${groups}</g></svg>`;

const DATA = {
  W,
  H,
  ex: unit([1, 0, 0]),
  ez: unit([0, 0, 1]),
  anchors: cached ? cached.anchors : Object.fromEntries(Object.entries(anchors).map(([id, p]) => [id, at(p)])),
  heart: at(HEART.c),
  lungs: { "pulmon-der": at([LUNGS.r.dome.c[0], LUNGS.r.dome.c[1], LUNGS.r.apex]), "pulmon-izq": at([LUNGS.l.dome.c[0], LUNGS.l.dome.c[1], LUNGS.l.apex]) },
  occluders: OCCL,
  pieces: PIECES,
  systems: SYSTEMS,
  rhythms: RHYTHMS,
};

const css = readFileSync(new URL("src/app.css", ROOT), "utf8");
const app = readFileSync(new URL("src/app.js", ROOT), "utf8");
const icon = readFileSync(new URL("src/icon.svg", ROOT), "utf8");
const page = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f2f2ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0b0b" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Torso ENARM">
<meta name="description" content="Atlas anatómico interactivo del torso para estudiar el ENARM: fichas por órgano, preguntas tipo examen y ritmos cardiacos.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}">
<title>Torso ENARM</title>
<style>${k.ISO_CSS}${css}</style>
</head>
<body class="iso" data-theme="light">
<header class="top">
  <div class="brand"><span class="brand-mark" aria-hidden="true"></span><span>Torso <b>ENARM</b></span></div>
  <nav class="tabs" role="tablist">
    <button role="tab" data-tab="atlas" aria-selected="true">Atlas</button>
    <button role="tab" data-tab="repaso" aria-selected="false">Repaso</button>
    <button role="tab" data-tab="ritmos" aria-selected="false">Ritmos</button>
  </nav>
  <button class="theme" type="button" aria-label="Cambiar tema claro u oscuro"><span aria-hidden="true"></span></button>
</header>
<section class="fig iso-plate" aria-label="Modelo">
  <div class="iso-plate-corners" aria-hidden="true">
    <span class="iso-plate-corner" data-corner="fig">Fig 1</span>
    <span class="iso-plate-corner" data-corner="title" data-title>Torso · vista anterolateral</span>
    <span class="iso-plate-corner" data-corner="hint" data-hint>Toca un órgano</span>
    <span class="iso-plate-corner" data-corner="readout" data-readout>FC 72 · FR 14</span>
  </div>
  <div class="stage" tabindex="0" role="group" aria-label="Modelo del torso. Toca un órgano o usa las flechas para recorrerlos; Escape para soltar.">${figure}</div>
  <span class="live" aria-live="polite" data-live></span>
</section>
<section class="monitor" aria-label="Monitor de ECG">
  <canvas class="ecg" aria-hidden="true"></canvas>
  <div class="mon-text">
    <span class="mon-rhythm" data-rhythm>Ritmo sinusal</span>
    <span class="mon-vals"><span class="mon-hr"><i>FC</i><b data-hr>72</b></span><span class="mon-sp"><i>SpO₂</i><b data-sp>98</b></span><span class="mon-rr"><i>FR</i><b data-rr>14</b></span></span>
  </div>
</section>
<nav class="chips" aria-label="Órganos"></nav>
<main class="panel"></main>
<script>window.__DATA__=${JSON.stringify(DATA)};</script>
<script>${app}</script>
<script>if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js");</script>
</body></html>`;

mkdirSync(new URL("docs/", ROOT), { recursive: true });
if (!cached && !FAST) {
  mkdirSync(new URL(".cache/", ROOT), { recursive: true });
  writeFileSync(CACHE, JSON.stringify({ figure, occluders: OCCL, anchors: DATA.anchors }));
}
writeFileSync(new URL("docs/index.html", ROOT), page);
console.log(`docs/index.html · ${(page.length / 1024).toFixed(0)} KB · ${R.items.length} items · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log("occluders", JSON.stringify(OCCL));
