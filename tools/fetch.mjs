// Downloads the BodyParts3D meshes the model uses into .cache/bp3d/stl.
// node tools/fetch.mjs [--list]
import { mkdirSync, existsSync, statSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { resolve } from "./parts.mjs";

const ROOT = new URL("../", import.meta.url);
const DIR = new URL(".cache/bp3d/", ROOT);
const STL = new URL("stl/", DIR);
const BASE = "https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/assets/BodyParts3D_data/stl/";
mkdirSync(STL, { recursive: true });

const index = JSON.parse(readFileSync(new URL("stl-index.json", DIR), "utf8"));
const parts = resolve(index);
writeFileSync(new URL("parts.json", DIR), JSON.stringify(parts, null, 1));

const files = parts.flatMap((p) => p.files);
const total = files.reduce((n, f) => n + f.kb, 0);
console.log(`${parts.length} structures · ${files.length} meshes · ${(total / 1024).toFixed(0)} MB · ${parts.reduce((n, p) => n + p.tris, 0)} triangles after decimation`);
if (process.argv.includes("--list")) {
  for (const p of parts) console.log(p.id.padEnd(18), String(p.files.length).padStart(3), `${(p.files.reduce((n, f) => n + f.kb, 0) / 1024).toFixed(1)} MB`.padStart(9), p.tris);
  process.exit(0);
}

const queue = files.filter((f) => {
  const path = new URL(`${f.id}.stl`, STL);
  // A binary STL is 84 bytes of header plus 50 per triangle.
  return !(existsSync(path) && (statSync(path).size - 84) % 50 === 0 && statSync(path).size > 84);
});
let done = 0;
let bytes = 0;
const failed = [];
async function worker() {
  for (;;) {
    const f = queue.shift();
    if (!f) return;
    const path = new URL(`${f.id}.stl`, STL);
    let ok = false;
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      try {
        const res = await fetch(BASE + encodeURIComponent(`${f.id}.stl`));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length <= 84 || (buf.length - 84) % 50 !== 0 || buf.readUInt32LE(80) * 50 + 84 !== buf.length) throw new Error(`not a binary STL (${buf.length} bytes)`);
        const tmp = new URL(`${f.id}.part`, STL);
        writeFileSync(tmp, buf);
        renameSync(tmp, path);
        bytes += buf.length;
        ok = true;
      } catch (error) {
        if (attempt === 3) failed.push(`${f.id} ${f.name}: ${error.message}`);
        else await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    done++;
    if (done % 25 === 0) console.log(`${done}/${done + queue.length} · ${(bytes / 1048576).toFixed(0)} MB`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`downloaded ${done - failed.length} · ${(bytes / 1048576).toFixed(0)} MB · failed ${failed.length}`);
if (failed.length) {
  console.log(failed.join("\n"));
  process.exit(1);
}
