// Prepare the self-contained GitHub Pages demo after `npm run build`.
//
// The stable `nimbly-docs.min.js` alias is convenient locally, but browsers may
// retain ESM module evaluations even when a file is overwritten. We therefore
// inject a content hash into the demo script URL on every build. Production
// consumers should still use the immutable hashed release filename from dist/.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "dist", "nimbly-docs.min.js");
const destinationDir = join(root, "docs", "assets");
const indexPath = join(root, "docs", "index.html");
if (!existsSync(source)) {
  console.error("Missing dist/nimbly-docs.min.js. Run `npm run build` first.");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const bundle = readFileSync(source);
const contentHash = createHash("sha256").update(bundle).digest("hex").slice(0, 12);
mkdirSync(destinationDir, { recursive: true });
cpSync(source, join(destinationDir, "nimbly-docs.min.js"));

// Publish a stable, versioned CDN path alongside the demo so the deployed
// GitHub Pages site can also serve the bundle as a public, pinnable URL:
//   <pages-origin>/cdn/nimbly-docs.<version>.min.js
const cdnDir = join(root, "docs", "cdn");
mkdirSync(cdnDir, { recursive: true });
const versioned = `nimbly-docs.${pkg.version}.min.js`;
cpSync(source, join(cdnDir, versioned));
cpSync(source, join(cdnDir, "nimbly-docs.latest.min.js"));
if (existsSync(source + ".map")) {
  cpSync(source + ".map", join(cdnDir, versioned + ".map"));
}
const sri = "sha384-" + createHash("sha384").update(bundle).digest("base64");
writeFileSync(join(cdnDir, versioned + ".sha384"), sri + "\n");

const index = readFileSync(indexPath, "utf8");
const updated = index.replace(
  /\.\/assets\/nimbly-docs\.min\.js(?:\?v=[^"']*)?/,
  `./assets/nimbly-docs.min.js?v=${contentHash}`
);
if (updated === index) {
  console.error("Could not find the Nimbly Docs bundle script in docs/index.html.");
  process.exit(1);
}
writeFileSync(indexPath, updated);
console.log(`✔ copied bundle into docs/assets (cache key ${contentHash})`);
console.log(`✔ published docs/cdn/${versioned}`);
