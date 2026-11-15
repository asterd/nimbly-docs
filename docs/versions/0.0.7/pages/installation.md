# Installation

Nimbly Docs is a native custom element. In production you don't need React, Vue, a server runtime or a package registry.

## Quick start

Generate a project skeleton, then add the bundle:

```bash
node scripts/create-docs.mjs my-docs --title "My Docs" --lang en
```

[Start a new project](./scaffold.md) lists all options and shows the generated layout.

## Minimal setup

Put the bundle, an `index.json` and your Markdown files on the same static host:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="module" src="/assets/nimbly-docs.0.0.7.<hash>.min.js"></script>
  </head>
  <body>
    <nimbly-docs manifest="./index.json"></nimbly-docs>
  </body>
</html>
```

Relative `source` paths in the manifest are resolved against the manifest, not against the bundle or the host page. The [Manifest reference](./manifest.md) describes the full structure and how page paths are found.

### Public CDN

If you don't want to host the bundle, load a versioned copy from GitHub Pages:

```html
<script type="module"
  src="https://asterd.github.io/nimbly-docs/cdn/nimbly-docs.0.0.7.min.js"
  crossorigin="anonymous"></script>
```

## Build from source

```bash
npm ci
npm run build
npm run size
npm run pages
npm run serve
```

Then open `http://localhost:8082/docs/`. `npm run pages` copies the built bundle into this demo site. For releases, use the hashed file name printed by `npm run build`.

## Subresource Integrity

If the bundle is served from another origin, pin the exact file and use the hash from the generated `.sha384` file:

```html
<script type="module"
  src="https://assets.example.com/nimbly-docs.0.0.7.<hash>.min.js"
  integrity="sha384-…"
  crossorigin="anonymous"></script>
```

Cache headers and CSP are covered in [Security model](./security.md).
