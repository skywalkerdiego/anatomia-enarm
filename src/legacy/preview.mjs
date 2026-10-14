import { writeFileSync } from "node:fs";
import { k, A } from "./geo.mjs";
import { W, H, projection, build } from "./torso.mjs";

const theme = process.argv.includes("--light") ? "light" : "dark";
const P = projection();
const t0 = Date.now();
const { R, back } = build(P);
if (!process.argv.includes("--fast")) A.settle(R, P, { states: [0] });
R.items.sort((a, b) => a.key - b.key);
const body = R.items.map((item) => `<g class="it" data-piece="${item.piece}">${item.svg}</g>`).join("");
const svg = k.figureSvg({ width: W, height: H, label: "preview", body: back.join("") + body });
const page = k.pageHtml({ title: "preview", theme, body: k.plateHtml({ fig: "Fig 1", title: "Torso", hint: "", readout: "", body: svg }), width: 700 });
writeFileSync(new URL(`../shots/preview${theme === "light" ? "-light" : ""}.html`, import.meta.url), page);
console.log(`items ${R.items.length} · ${(page.length / 1024).toFixed(0)} KB · ${Date.now() - t0} ms`);
if (process.argv.includes("--audit")) A.auditOrExit(R, P, { apart: false });
