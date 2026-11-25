// Build script for Nimbly Docs.
// Produces a single, self-contained, minified ESM bundle:
//   dist/nimbly-docs.<version>.<hash>.min.js
//   dist/nimbly-docs.<version>.<hash>.min.js.map
//   dist/nimbly-docs.<version>.<hash>.min.js.sha384
// Also writes stable unhashed aliases (nimbly-docs.min.js) for local/dev use.
import { build, context, transform } from "esbuild";
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
  plugins: [{
    // The stylesheet is inlined as a string: minify it like the JS it ships in.
    name: "minify-css-text",
    setup(b) {
      b.onLoad({ filter: /\.css$/ }, async (args) => {
        const source = readFileSync(args.path, "utf8");
        const { code } = await transform(source, { loader: "css", minify: !dev, target: ["chrome105", "safari16", "firefox110"] });
        return { contents: code, loader: "text" };
      });
    },
  }],
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

// Optional plugins are separate files and never part of the core bundle:
//   dist/plugins/<name>.<version>.<hash>.min.js (+ .map, .sha384) and a stable
//   unhashed alias dist/plugins/<name>.min.js, mirroring the core release files.
// They are not counted by `npm run size`, which only budgets the core.
const pluginEntries = ["archify-embed"];

async function buildPlugins() {
  mkdirSync(join(dist, "plugins"), { recursive: true });
  for (const name of pluginEntries) {
    const outfile = join(dist, "plugins", `${name}.min.js`);
    await build({
      entryPoints: [join(root, "src", "plugins", `${name}.ts`)],
      bundle: true, format: "esm", target: ["es2021"], platform: "browser",
      minify: !dev, sourcemap: true, legalComments: "none", charset: "utf8", outfile,
    });
    const code = readFileSync(outfile);
    const hash = createHash("sha256").update(code).digest("hex").slice(0, 10);
    const hashed = `${name}.${pkg.version}.${hash}.min.js`;
    writeFileSync(join(dist, "plugins", hashed), code);
    if (existsSync(outfile + ".map")) writeFileSync(join(dist, "plugins", hashed + ".map"), readFileSync(outfile + ".map"));
    const sri = "sha384-" + createHash("sha384").update(code).digest("base64");
    writeFileSync(join(dist, "plugins", hashed + ".sha384"), sri + "\n");
    writeFileSync(outfile + ".sha384", sri + "\n");
    console.log(`✔ built plugins/${hashed} (${(code.length / 1024).toFixed(1)} KB raw)`);
    console.log(`  SRI: ${sri}`);
  }
}

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("watching for changes…");
} else {
  const result = await build(options);
  await finalize(result);
  await buildPlugins();
}
