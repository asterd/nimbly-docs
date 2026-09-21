# Installation

Nimbly Docs is a native custom element. It does not require React, Vue, a server runtime, or a package registry in production.

## Fastest start

Scaffold a project skeleton, then drop in the bundle:

```bash
node scripts/create-docs.mjs my-docs --title "My Docs" --lang en
```

See **[Start a new project](./scaffold.md)** for all options and the generated layout.

## Minimal integration

Put the built bundle, an `index.json`, and your Markdown files on the same static origin:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="module" src="/assets/nimbly-docs.0.0.3.<hash>.min.js"></script>
  </head>
  <body>
    <nimbly-docs manifest="./index.json"></nimbly-docs>
  </body>
</html>
```

Relative `source` paths in the manifest are resolved against the manifest itself, **not** against the bundle or the host page. See **[Manifest reference](./manifest.md)** for the full structure and the convention-based path resolution.

### Public CDN

You can also load a versioned bundle straight from GitHub Pages or jsDelivr instead of hosting it yourself:

```html
<script type="module"
  src="https://asterd.github.io/nimbly-docs/cdn/nimbly-docs.0.0.3.min.js"
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

Open `http://localhost:8082/docs/`. The `pages` task copies the stable built bundle into this demo directory; release consumers should prefer the immutable filename printed by `npm run build`.

## Subresource Integrity

When the viewer is served from another allowed origin, pin the exact bundle and use the generated `.sha384` content:

```html
<script type="module"
  src="https://assets.example.com/nimbly-docs.0.0.3.<hash>.min.js"
  integrity="sha384-…"
  crossorigin="anonymous"></script>
```

For deployment cache headers and CSP, see [Security model](./security.md).
