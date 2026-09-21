// Minimal static server for local development / example preview.
// Serves the repo root with correct MIME types and short-cache for docs assets.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, normalize } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const port = Number(process.env.PORT || 8082);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".map": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    let filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    let s;
    try {
      s = await stat(filePath);
    } catch {
      res.writeHead(404).end("Not found");
      return;
    }
    if (s.isDirectory()) filePath = join(filePath, "index.html");
    const body = await readFile(filePath);
    const type = MIME[extname(filePath)] || "application/octet-stream";
    const headers = { "Content-Type": type };
    if (/\.\w+\.\w+\.min\.js$/.test(filePath)) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else {
      headers["Cache-Control"] = "no-cache";
    }
    res.writeHead(200, headers).end(body);
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
});

server.listen(port, () => {
  console.log(`Nimbly Docs dev server → http://localhost:${port}/docs/`);
});
