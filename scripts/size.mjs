// Verifies the built bundle against the gzip size budget from the spec (<=120 KB gzip).
import { gzipSync, brotliCompressSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "..", "dist");
const BUDGET_GZIP_KB = 120;

const file = readdirSync(dist).find((f) => /^nimbly-docs\.\d.*\.min\.js$/.test(f));
if (!file) {
  console.error("No hashed bundle found in dist/. Run `npm run build` first.");
  process.exit(1);
}

const code = readFileSync(join(dist, file));
const raw = code.length / 1024;
const gzip = gzipSync(code, { level: 9 }).length / 1024;
const brotli = brotliCompressSync(code).length / 1024;

console.log(`bundle: ${file}`);
console.log(`  raw:    ${raw.toFixed(1)} KB`);
console.log(`  gzip:   ${gzip.toFixed(1)} KB  (budget ${BUDGET_GZIP_KB} KB)`);
console.log(`  brotli: ${brotli.toFixed(1)} KB`);

if (gzip > BUDGET_GZIP_KB) {
  console.error(`✘ over budget by ${(gzip - BUDGET_GZIP_KB).toFixed(1)} KB gzip`);
  process.exit(1);
}
console.log(`✔ within budget (${(BUDGET_GZIP_KB - gzip).toFixed(1)} KB headroom)`);
