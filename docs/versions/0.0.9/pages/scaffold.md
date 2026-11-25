# Start a new project

`create-docs` creates a documentation folder with a manifest, a host page and starter pages, laid out the way the viewer expects.

## Run it

From this repository:

```bash
node scripts/create-docs.mjs my-docs --title "Acme Platform" --lang en,it
# or via the npm script
npm run init -- my-docs --title "Acme Platform" --lang en,it
```

If the package is installed, you can use its binary:

```bash
npx nimbly-docs-init my-docs --title "Acme Platform" --lang en,it
```

## Without installing anything

The scaffolder is a plain ESM script, so you can run it from the CDN without cloning the repository or installing a package. Pipe it into Node:

```bash
curl -fsSL https://asterd.github.io/nimbly-docs/cdn/create-docs.mjs \
  | node - my-docs --title "Acme Platform" --lang en,it --bundle https://asterd.github.io/nimbly-docs/cdn/nimbly-docs.latest.min.js
```

Arguments after `node -` are passed to the script. In this mode it downloads `manifest.schema.json` from the CDN into your project; if that fails, `$schema` points to the remote URL instead. With `--bundle` set to the CDN, the generated `index.html` works without a local build.

Node can't run a remote URL directly and `npx` needs a published package, which is why this uses `curl … | node -`.

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

With `--lang en,it` the manifest gets a `languages` block, which adds the language menu to the header, and Italian pages are created under `pages/it/`. Sources are plain file names, so the viewer loads `pages/introduction.md` in English and `pages/it/introduction.md` in Italian.

## After scaffolding

1. Copy the viewer bundle to `my-docs/assets/nimbly-docs.min.js`, or point `--bundle` at a CDN URL such as the GitHub Pages `/cdn/` path.
2. Serve the folder with any static server and open `index.html`.
3. Edit `index.json` to set up the navigation, then write your pages under `pages/`.

You can edit, rename or delete any generated file. Running the command again without `--force` leaves existing files alone.

## Freeze a release

Before you start documenting a new release, save the current docs as a version:

```bash
npx nimbly-docs-version 1.x --docs my-docs --label "v1.x"
```

This copies the manifest, pages and images to `my-docs/versions/1.x/` and adds the copy to the root manifest. The header then shows a version menu. See [Versioned docs](./versions.md).
