// A static server for docs/, for testing on this machine: node tools/serve.mjs [port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../docs/", import.meta.url)));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".gz": "application/gzip" };
const port = Number(process.argv[2]) || 8787;
createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname).split("/").filter((part) => part && part !== "..").join("/");
  const file = resolve(join(ROOT, path || "index.html"));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) return res.writeHead(403).end();
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "content-length": data.length, "cache-control": "no-store" }).end(data);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`http://127.0.0.1:${port}/`));
