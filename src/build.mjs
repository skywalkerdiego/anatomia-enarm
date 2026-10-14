// Builds docs/index.html: the app, its content and both bodies' descriptions in one page.
// The meshes are docs/models/<body>.bin.gz, made by tools/build_model.py (Blender) and tools/pack.mjs.
//   node src/build.mjs
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import * as k from "../vendor/anatomy-kit/kit/iso-kit.mjs";
import { STRUCTS, MATS, LAYERS, SYSTEMS } from "./content/structs.mjs";
import { CARDS } from "./content/cards.mjs";
import { PROCESSES } from "./content/processes.mjs";
import { CASES } from "./content/cases.mjs";
import { RHYTHMS, FACTS } from "./content/extras.mjs";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, ROOT), "utf8");
const BODIES = ["mujer", "hombre"];
const models = {}, files = {};
for (const name of BODIES) {
  models[name] = JSON.parse(read(`src/models/${name}.json`));
  const gz = readFileSync(new URL(`docs/models/${name}.bin.gz`, ROOT));
  files[name] = { url: `models/${name}.bin.gz?v=${createHash("sha1").update(gz).digest("hex").slice(0, 10)}`, size: gz.length };
}
const body = models.hombre;
const version = createHash("sha1").update(JSON.stringify(files)).digest("hex").slice(0, 10);

// Every structure of either body needs a name and a card that exists; every card needs a home.
for (const name of BODIES) {
  for (const s of models[name].structs) {
    if (!STRUCTS[s.id]) throw new Error(`structs.mjs has no entry for ${s.id}`);
    const card = STRUCTS[s.id].card;
    if (card && !CARDS[card]) throw new Error(`${s.id} points to the missing card ${card}`);
  }
}
// Scenes written for one body are checked against it; the rest against the male body, with a
// note for anchors the female body lacks (the stage skips those there).
const missing = new Set();
for (const p of PROCESSES) for (const scene of [p.base, ...p.steps.map((step) => step.scene)]) checkScene(scene, `process ${p.id}`, p.model);
for (const c of CASES) {
  checkScene(c.base, `case ${c.id}`, c.model);
  for (const node of [c.intro, ...c.nodes]) {
    checkScene(node.scene, `case ${c.id}`, c.model);
    checkScene(node.after?.scene, `case ${c.id}`, c.model);
    if (node.q && !(node.ok >= 0 && node.ok < node.options.length)) throw new Error(`case ${c.id}: bad answer index in "${node.q}"`);
  }
  for (const id of c.organs || []) if (!CARDS[id]) throw new Error(`case ${c.id}: unknown card ${id}`);
}
function checkScene(scene, where, model) {
  if (!scene) return;
  if (!model) checkAnchors(scene, where, "mujer", true);
  checkAnchors(scene, where, model || "hombre", false);
}
function checkAnchors(scene, where, model, soft) {
  const body = models[model];
  const ids = [...Object.keys(scene.fx || {}), ...Object.keys(scene.ghost || {}), ...(scene.only || []), ...(scene.hide || []), ...(scene.select ? [scene.select] : [])];
  for (const id of ids) if (!STRUCTS[id]) throw new Error(`${where}: unknown structure ${id}`);
  // Anchors that name a structure or one of its parts must exist in the model.
  const meta = Object.fromEntries(body.structs.map((s) => [s.id, s]));
  const anchors = [...(scene.pins || []).map((p) => p.at), ...(typeof scene.focus === "string" ? [scene.focus] : [])];
  for (const fx of Object.values(scene.fx || {})) {
    for (const key of ["spot", "spot2"]) if (fx[key]) anchors.push(fx[key][0]);
    if (fx.cut) anchors.push(typeof fx.cut === "string" ? fx.cut : fx.cut.at, ...(fx.cut.part ? [`${fx.cut.at.split("/")[0]}/${fx.cut.part}`] : []));
  }
  for (const spec of anchors.flatMap((a) => (typeof a === "string" && a.startsWith("mid:") ? a.slice(4).split(",").map((x) => x.trim()) : [a]))) {
    if (typeof spec !== "string" || spec.startsWith("@") || spec === "home" || /^[CTL]\d+$|^S$/.test(spec)) continue;
    const [head, part] = spec.split("/");
    const [id, rest] = head.split(/[@#]/);
    const name = part ?? (head.includes("#") ? rest : null);
    const bad = !meta[id] ? "names an unknown structure" : name && !meta[id].parts.some((q) => q.n === name) ? "names an unknown part" : "";
    if (bad && soft) missing.add(`${where}: ${spec}`);
    else if (bad) throw new Error(`${where} (${model}): anchor "${spec}" ${bad}`);
  }
}

if (missing.size) console.log(`not in the female body (skipped there): ${[...missing].join("; ")}`);

const DATA = {
  version,
  cam: { fitH: 1980, fitW: 1050, home: [0, 0, 880], cursorRest: 900, rodTop: 1790 },
  models, files,
  structs: STRUCTS, mats: MATS, layers: LAYERS, systems: SYSTEMS,
  cards: CARDS, processes: PROCESSES, cases: CASES, rhythms: RHYTHMS, facts: FACTS,
};

// The mesh decoder runs in the page; its module export is dropped so it inlines as a script.
const decoder = read("node_modules/meshoptimizer/meshopt_decoder.mjs").replace(/export\s*\{[^}]*\};?\s*$/m, "");
const FILES = ["core", "body", "physio", "monitor", "stage", "sheet", "explore", "processes", "cases", "quiz", "main"];
const app = decoder + "\n" + FILES.map((name) => read(`src/app/${name}.js`)).join("\n");
const css = read("src/app/app.css");
const iconSvg = read("src/icon.svg");
const tab = (id, name, glyph, on) => `<button role="tab" data-tab="${id}" aria-selected="${on}"><svg class="ic" viewBox="0 0 20 20" aria-hidden="true">${glyph}</svg><span>${name}</span></button>`;

const page = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#f2f2ef">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Cuerpo ENARM">
<meta name="description" content="Atlas 3D del cuerpo humano para estudiar el ENARM: explora órganos, mira cómo funcionan los procesos y resuelve casos clínicos simulados.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(iconSvg)}">
<title>Cuerpo ENARM</title>
<style>${k.ISO_CSS}${css}</style>
</head>
<body class="iso" data-theme="light">
<div class="app">
  <section class="stage" aria-label="Modelo anatómico">
    <canvas class="gl" tabindex="0" role="img" aria-label="Cuerpo humano en tres dimensiones sobre un pedestal giratorio. Arrastra para girarlo, pellizca para acercar y toca una estructura para estudiarla."></canvas>
    <div class="pins" aria-hidden="true"></div>
    <div class="hud hud-top"><span class="hud-fig" data-fig>Fig 1</span><span class="hud-title" data-title>Cuerpo humano · 1:1</span></div>
    <div class="sex" role="group" aria-label="Cuerpo"></div>
    <div class="hud hud-foot"><span data-hint>Arrastra para girar · toca un órgano</span><span class="hud-read"><b data-level></b></span></div>
    <div class="rail" role="group" aria-label="Capas del modelo"></div>
    <div class="tools" role="group" aria-label="Vista"></div>
    <div class="loading" role="status"><div class="loading-card"><span class="brand-mark" aria-hidden="true"></span><b>Cuerpo ENARM</b><span data-loading>Cargando el modelo…</span><i><u></u></i></div></div>
  </section>
  <section class="monitor" aria-label="Monitor de signos vitales">
    <canvas class="ecg" aria-hidden="true"></canvas>
    <div class="mon-top"><span class="mon-rhythm" data-rhythm>Ritmo sinusal</span><button class="mon-sound" type="button" aria-label="Ruidos cardiacos" aria-pressed="false"></button></div>
    <div class="mon-vals">
      <span class="mon-hr"><i>FC</i><b data-hr>72</b></span>
      <span class="mon-bp"><i>TA</i><b data-bp>118/76</b></span>
      <span class="mon-sp"><i>SpO₂</i><b data-sp>98</b></span>
      <span class="mon-rr"><i>FR</i><b data-rr>14</b></span>
    </div>
  </section>
  <section class="sheet" data-snap="peek" aria-label="Contenido">
    <div class="grab" role="button" tabindex="0" aria-label="Cambiar el tamaño del panel"><i></i></div>
    <div class="sheet-scroll"><main class="view"></main></div>
  </section>
  <nav class="tabbar" role="tablist" aria-label="Modos">
    ${tab("explorar", "Explorar", '<path d="M10 2.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM6 8.4h8M10 6.4v6.2M10 12.6l-2.6 5M10 12.6l2.6 5M6 8.4l-1.4 4.4M14 8.4l1.4 4.4"/>', true)}
    ${tab("procesos", "Procesos", '<path d="M3 10h3l2-5 3 10 2-7 1.4 2H17"/>', false)}
    ${tab("casos", "Casos", '<path d="M4 6.5h12v9.5H4zM7.5 6.5V4.5h5v2M10 9.2v4M8 11.2h4"/>', false)}
    ${tab("repaso", "Repaso", '<path d="M7.6 7.6a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2.9-1.2 1.8M10 14.6v.2"/><circle cx="10" cy="10" r="7.2"/>', false)}
  </nav>
  <div class="toast" role="status" aria-live="polite"></div>
</div>
<script>window.__DATA__=${JSON.stringify(DATA).replace(/</g, "\\u003c")};</script>
<script>(()=>{"use strict";
${app}
})();</script>
</body></html>`;

mkdirSync(new URL("docs/", ROOT), { recursive: true });
writeFileSync(new URL("docs/index.html", ROOT), page);

// The service worker caches the page and the model under this build's version.
const sw = `const CACHE="cuerpo-enarm-${createHash("sha1").update(page).digest("hex").slice(0, 10)}";
const FILES=["./","index.html","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE).then((c)=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((k)=>k!==CACHE).map((k)=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",(e)=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request).then((hit)=>hit||fetch(e.request).then((res)=>{
    if(res.ok&&new URL(e.request.url).origin===location.origin){const copy=res.clone();caches.open(CACHE).then((c)=>c.put(e.request,copy));}
    return res;
  }).catch(()=>caches.match("index.html"))));
});
`;
writeFileSync(new URL("docs/sw.js", ROOT), sw);
console.log(`docs/index.html · ${(page.length / 1024).toFixed(0)} KB · models ${BODIES.map((n) => `${n} ${(files[n].size / 1048576).toFixed(1)} MB`).join(", ")} · ${body.structs.length} structures · ${Object.keys(CARDS).length} cards · ${PROCESSES.length} processes · ${CASES.length} cases`);
