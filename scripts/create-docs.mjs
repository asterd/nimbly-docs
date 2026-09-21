#!/usr/bin/env node
/**
 * Scaffold a new Nimbly Docs documentation project.
 *
 * Usage:
 *   node scripts/create-docs.mjs [targetDir] [--title "My Docs"] [--lang en,it] [--force]
 *   npx nimbly-docs-init my-docs --title "Acme" --lang en,it
 *
 * Creates:
 *   <target>/index.html         host page loading the viewer bundle
 *   <target>/index.json         starter manifest (convention-based sources)
 *   <target>/pages/*.md         starter pages for the default language
 *   <target>/pages/<lang>/*.md  starter pages for each extra language
 *   <target>/assets/            place your logo/images here
 *
 * It never overwrites existing files unless --force is given.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const args = { _: [], title: "My Documentation", lang: "en", force: false, bundle: "./assets/nimbly-docs.min.js" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") args.force = true;
    else if (a === "--title") args.title = argv[++i] ?? args.title;
    else if (a === "--lang") args.lang = argv[++i] ?? args.lang;
    else if (a === "--bundle") args.bundle = argv[++i] ?? args.bundle;
    else if (a.startsWith("--")) { /* ignore unknown flags */ }
    else args._.push(a);
  }
  return args;
}

function write(path, content, force) {
  if (existsSync(path) && !force) {
    console.log(`• skip (exists): ${path}`);
    return;
  }
  writeFileSync(path, content);
  console.log(`✓ ${path}`);
}

const args = parseArgs(process.argv.slice(2));
const target = resolve(args._[0] || "docs");
const langs = args.lang.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const [defaultLang, ...extraLangs] = langs.length ? langs : ["en"];
const title = args.title;

const LANG_LABEL = { en: "English", it: "Italiano", es: "Español", fr: "Français", de: "Deutsch" };

mkdirSync(join(target, "pages"), { recursive: true });
mkdirSync(join(target, "assets"), { recursive: true });
for (const l of extraLangs) mkdirSync(join(target, "pages", l), { recursive: true });

// Starter manifest. Sources use bare paths; the viewer resolves them via the
// convention fallback (explicit → pages/<file> → pages/<locale>/<file>).
const manifest = {
  $schema: "./manifest.schema.json",
  version: "1.0",
  title,
  language: defaultLang,
  theme: "nimbus",
  home: "introduction",
  features: { search: true, toc: true, copyCode: true, previousNext: true, breadcrumbs: true },
  sections: [
    {
      id: "getting-started",
      title: "Getting started",
      pages: [
        { id: "introduction", title: "Introduction", source: "introduction.md" },
        { id: "quick-start", title: "Quick start", source: "quick-start.md" },
      ],
    },
  ],
};
if (langs.length > 1) {
  manifest.languages = langs.map((code) => ({ code, label: LANG_LABEL[code] || code.toUpperCase() }));
}

write(join(target, "index.json"), JSON.stringify(manifest, null, 2) + "\n", args.force);

// Provide a local manifest.schema.json so `$schema: "./manifest.schema.json"`
// resolves in editors/CI without warnings. This must work in three modes:
//   - repo checkout: copy the sibling docs/manifest.schema.json;
//   - remote run (curl | node -): fetch the schema from the published CDN;
//   - offline remote: fall back to pointing $schema at the remote URL.
const SCHEMA_URL = "https://asterd.github.io/nimbly-docs/manifest.schema.json";
await ensureSchema(target, args.force);

async function ensureSchema(dir, force) {
  const dest = join(dir, "manifest.schema.json");
  if (existsSync(dest) && !force) {
    console.log(`• skip (exists): ${dest}`);
    return;
  }
  // 1. Local sibling (repo checkout).
  try {
    const local = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "manifest.schema.json");
    if (existsSync(local)) {
      copyFileSync(local, dest);
      console.log(`✓ ${dest}`);
      return;
    }
  } catch {
    /* fall through to remote */
  }
  // 2. Remote fetch (works for `curl | node -`).
  try {
    if (typeof fetch === "function") {
      const res = await fetch(SCHEMA_URL);
      if (res.ok) {
        writeFileSync(dest, await res.text());
        console.log(`✓ ${dest} (fetched)`);
        return;
      }
    }
  } catch {
    /* fall through to URL reference */
  }
  // 3. Could not obtain the file: point $schema at the remote URL instead so the
  //    generated manifest still validates in editors.
  console.log(`• schema not bundled; using remote $schema URL`);
  patchManifestSchemaUrl(join(dir, "index.json"), SCHEMA_URL);
}

function patchManifestSchemaUrl(indexPath, url) {
  try {
    const json = JSON.parse(readFileSync(indexPath, "utf8"));
    json.$schema = url;
    writeFileSync(indexPath, JSON.stringify(json, null, 2) + "\n");
  } catch {
    /* best-effort */
  }
}

// Host page.
const html = `<!doctype html>
<html lang="${defaultLang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${title}">
    <title>${title}</title>
    <script type="module" src="${args.bundle}"></script>
  </head>
  <body>
    <nimbly-docs manifest="./index.json" theme="nimbus" search="on" toc="auto"></nimbly-docs>
  </body>
</html>
`;
write(join(target, "index.html"), html, args.force);

// Starter pages per language.
const page = (heading, body) => `# ${heading}\n\n${body}\n`;
const starters = {
  "introduction.md": {
    en: page("Introduction", "Welcome to your new documentation. Edit `pages/introduction.md` to get started."),
    it: page("Introduzione", "Benvenuto nella tua nuova documentazione. Modifica `pages/it/introduction.md` per iniziare."),
    es: page("Introducción", "Bienvenido a tu nueva documentación. Edita `pages/es/introduction.md`."),
    fr: page("Introduction", "Bienvenue dans votre nouvelle documentation. Modifiez `pages/fr/introduction.md`."),
    de: page("Einführung", "Willkommen in Ihrer neuen Dokumentation. Bearbeiten Sie `pages/de/introduction.md`."),
  },
  "quick-start.md": {
    en: page("Quick start", "Describe the fastest path to value here.\n\n```bash\n# example\necho \"hello\"\n```"),
    it: page("Guida rapida", "Descrivi qui il percorso più veloce.\n\n```bash\n# esempio\necho \"ciao\"\n```"),
    es: page("Inicio rápido", "Describe aquí el camino más rápido.\n\n```bash\necho \"hola\"\n```"),
    fr: page("Démarrage rapide", "Décrivez ici le chemin le plus rapide.\n\n```bash\necho \"bonjour\"\n```"),
    de: page("Schnellstart", "Beschreiben Sie hier den schnellsten Weg.\n\n```bash\necho \"hallo\"\n```"),
  },
};
for (const [file, byLang] of Object.entries(starters)) {
  write(join(target, "pages", file), byLang[defaultLang] || byLang.en, args.force);
  for (const l of extraLangs) write(join(target, "pages", l, file), byLang[l] || byLang.en, args.force);
}

console.log(`\nDone. Next steps:`);
console.log(`  1. Put the built viewer bundle at: ${join(target, args.bundle.replace(/^\.\//, ""))}`);
console.log(`  2. Serve the folder and open index.html (e.g. any static server).`);
console.log(`  3. Edit index.json and the Markdown files under pages/.`);
