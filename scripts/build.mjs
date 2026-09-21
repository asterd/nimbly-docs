// Build script for Nimbly Docs.
// Produces a single, self-contained, minified ESM bundle:
//   dist/nimbly-docs.<version>.<hash>.min.js
//   dist/nimbly-docs.<version>.<hash>.min.js.map
//   dist/nimbly-docs.<version>.<hash>.min.js.sha384
// Also writes stable unhashed aliases (nimbly-docs.min.js) for local/dev use.
import { build, context } from "esbuild";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const args = process.argv.slice(2);
const dev = args.includes("--dev");
const watch = args.includes("--watch");

mkdirSync(dist, { recursive: true });

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [join(root, "src/index.ts")],
  bundle: true,
  format: "esm",
  target: ["es2021"],
  platform: "browser",
  minify: !dev,
  sourcemap: true,
  legalComments: "none",
  charset: "utf8",
  define: {
    "__NIMBLY_VERSION__": JSON.stringify(pkg.version),
  },
  loader: { ".css": "text" },
  outfile: join(dist, "nimbly-docs.min.js"),
  metafile: true,
};

async function finalize(result) {
  // Read the produced stable file, compute hash, write hashed release artifacts.
  const jsPath = join(dist, "nimbly-docs.min.js");
  const code = readFileSync(jsPath);
  const shortHash = createHash("sha256").update(code).digest("hex").slice(0, 10);
  const sri = "sha384-" + createHash("sha384").update(code).digest("base64");
  const base = `nimbly-docs.${pkg.version}.${shortHash}.min.js`;

  // Copy stable -> hashed
  writeFileSync(join(dist, base), code);
  if (existsSync(jsPath + ".map")) {
    const map = readFileSync(jsPath + ".map");
    writeFileSync(join(dist, base + ".map"), map);
  }
  writeFileSync(join(dist, base + ".sha384"), sri + "\n");

  if (result?.metafile) {
    writeFileSync(join(dist, "meta.json"), JSON.stringify(result.metafile));
  }

  const kb = (code.length / 1024).toFixed(1);
  console.log(`✔ built ${base} (${kb} KB raw)`);
  console.log(`  SRI: ${sri}`);
  return { base, sri };
}

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("watching for changes…");
} else {
  const result = await build(options);
  await finalize(result);
}
