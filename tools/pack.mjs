// Compresses each body built by tools/build_model.py with meshoptimizer and gzip.
//   node tools/pack.mjs            → docs/models/<body>.bin.gz and src/models/<body>.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { MeshoptEncoder } from "meshoptimizer";

const ROOT = new URL("../", import.meta.url);
await MeshoptEncoder.ready;
mkdirSync(new URL("docs/models/", ROOT), { recursive: true });
mkdirSync(new URL("src/models/", ROOT), { recursive: true });
for (const body of ["hombre", "mujer"]) {
  const dir = new URL(`.cache/models/${body}/`, ROOT);
  if (!existsSync(new URL("meta.json", dir))) continue;
  const meta = JSON.parse(readFileSync(new URL("meta.json", dir), "utf8"));
  const raw = readFileSync(new URL("raw.bin", dir));
  const out = [];
  let offset = 0;
  for (const s of meta.structs) {
    const [vo, vl, nv] = s.v, [io, il, ni] = s.i;
    const verts = new Uint8Array(raw.buffer, raw.byteOffset + vo, vl);
    const idx = new Uint32Array(raw.buffer.slice(raw.byteOffset + io, raw.byteOffset + io + il));
    // Reorder for the vertex cache, then for fetch: smaller after encoding, faster to draw.
    const [remap, unique] = MeshoptEncoder.reorderMesh(idx, true, false);
    const sorted = new Uint8Array(unique * 16);
    for (let i = 0; i < nv; i++) if (remap[i] !== 0xffffffff) sorted.set(verts.subarray(i * 16, i * 16 + 16), remap[i] * 16);
    const vb = MeshoptEncoder.encodeVertexBuffer(sorted, unique, 16);
    const ib = MeshoptEncoder.encodeIndexBuffer(new Uint8Array(idx.buffer), ni, 4);
    s.v = [offset, vb.length, unique];
    offset += vb.length;
    s.i = [offset, ib.length, ni];
    offset += ib.length;
    out.push(vb, ib);
  }
  const blob = Buffer.concat(out.map((b) => Buffer.from(b.buffer, b.byteOffset, b.length)));
  meta.bytes = blob.length;
  meta.vertices = meta.structs.reduce((n, s) => n + s.v[2], 0);
  meta.indices = meta.structs.reduce((n, s) => n + s.i[2], 0);
  const gz = gzipSync(blob, { level: 9 });
  writeFileSync(new URL(`docs/models/${body}.bin.gz`, ROOT), gz);
  writeFileSync(new URL(`src/models/${body}.json`, ROOT), JSON.stringify(meta));
  console.log(`${body}: ${meta.structs.length} structures · ${meta.vertices} vertices · ${meta.indices / 3} triangles · ${(raw.length / 1e6).toFixed(1)} MB raw → ${(blob.length / 1e6).toFixed(2)} MB meshopt → ${(gz.length / 1e6).toFixed(2)} MB gzip`);
}
