# Start a new project

`create-docs` scaffolds a complete, ready-to-edit documentation folder so you don't hand-write the manifest and directory layout from scratch. It follows the same conventions the viewer resolves at runtime.

## Run it

From this repository:

```bash
node scripts/create-docs.mjs my-docs --title "Acme Platform" --lang en,it
# or via the npm script
npm run init -- my-docs --title "Acme Platform" --lang en,it
```

If the package is installed, the bundled binary is available too:

```bash
npx nimbly-docs-init my-docs --title "Acme Platform" --lang en,it
```

## Zero-install (remote, nothing downloaded)

Because the scaffolder is a plain ESM script, you can run it straight from the CDN without cloning the repo or installing a package. Pipe it into Node via stdin:

```bash
curl -fsSL https://asterd.github.io/nimbly-docs/cdn/create-docs.mjs \
  | node - my-docs --title "Acme Platform" --lang en,it --bundle https://asterd.github.io/nimbly-docs/cdn/nimbly-docs.latest.min.js
```

Everything after `node -` is passed to the script as arguments. In this mode the script fetches `manifest.schema.json` from the CDN and writes it into your project, so `$schema` still resolves; if the network is unavailable it falls back to referencing the schema by its remote URL. Pointing `--bundle` at the public CDN means the generated `index.html` needs no local build at all.

> `node <url>` cannot execute a remote URL directly and `npx` needs a published package, so the `curl … | node -` pipe is the reliable zero-install path.

## Options

| Argument | Default | Description |
| --- | --- | --- |
| `[targetDir]` | `docs` | Folder to create the project in. |
| `--title "..."` | `My Documentation` | Site title used in the manifest and host page. |
| `--lang a,b,c` | `en` | Comma-separated locales; the first is the default language. |
| `--bundle <url>` | `./assets/nimbly-docs.min.js` | Script URL written into `index.html`. |
| `--force` | off | Overwrite existing files (otherwise they are skipped). |

## What it generates

```text
my-docs/
├─ index.html                # loads the viewer, renders <nimbly-docs>
├─ index.json                # starter manifest (convention-based sources)
├─ manifest.schema.json      # copied for editor/CI autocompletion
├─ assets/                   # put your bundle and images here
└─ pages/
   ├─ introduction.md
   ├─ quick-start.md
   └─ it/                    # created for each extra language
      ├─ introduction.md
      └─ quick-start.md
```

With `--lang en,it` the manifest includes a `languages` block (so the header language selector appears), and Italian starter pages are created under `pages/it/`. Because sources use bare filenames, the viewer resolves `pages/introduction.md` for English and `pages/it/introduction.md` for Italian automatically.

## After scaffolding

1. Copy the built viewer bundle to `my-docs/assets/nimbly-docs.min.js` (or point `--bundle` at a CDN URL such as the GitHub Pages `/cdn/` path).
2. Serve the folder with any static server and open `index.html`.
3. Edit `index.json` to shape the navigation, then write your Markdown under `pages/`.

The generated files are a starting point: safe to edit, rename or delete. Re-running without `--force` never clobbers your work.
