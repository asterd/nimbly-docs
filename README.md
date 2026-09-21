# Nimbly Docs

> A secure, zero-runtime-dependency Markdown documentation viewer in one ESM bundle.

[![Build](https://github.com/asterd/nimbly-docs/actions/workflows/pages.yml/badge.svg)](../../actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bundle budget](https://img.shields.io/badge/gzip%20budget-%3C120%20KB-success)](#performance-and-caching)

**Nimbly Docs** is a native `<nimbly-docs>` Web Component for documentation that ships alongside an application. It gives teams the practical UX expected from Docsify—nested navigation, hash routing, local search, page TOC, themes, code copy buttons, responsive design and Markdown—without frameworks, remote plugins, CDN resources, cookies or telemetry.

> **Live demo:** enable GitHub Pages for the repository, then open `https://asterd.github.io/nimbly-docs/`. The ready-to-deploy demo lives in [`docs/`](docs/).

## Why Nimbly Docs?

| | Nimbly Docs | Typical Docsify-style deployment |
| --- | --- | --- |
| Runtime | One self-contained ESM bundle | Core plus optional CDN plugins/themes |
| Configuration | Validated `index.json` beside content | Global JavaScript configuration |
| Plugins | Explicit, application-owned local API | Often remote/dynamic |
| Markdown security | Raw HTML disabled, allow-list sanitization | Depends on configuration/plugin choices |
| Routing | Hash routes, no rewrite needed | Hash routes available |
| Styling | Shadow DOM + CSS parts/properties | Global page CSS by default |
| Data collection | None | Varies by add-ons |

The primary design boundary is intentional: **manifests describe documentation; they never execute code**. No JavaScript, CSS, remote plugin, font or iframe can be introduced by a manifest.

## Features

- **Single static ESM file**: minified, hashed release artifact, source map and SHA-384 SRI file.
- **No production dependencies**: native browser APIs only; no framework or network-loaded asset.
- **Manifest-first IA**: validated nested sections, globally unique stable ids, page limits, relative URL resolution, home page and feature switches.
- **Hash routing**: deep links such as `#/api/orders#cancellation`, refresh support, browser back/forward, no server rewrite rules.
- **Safe Markdown**: headings, links, images, lists, task lists, blockquotes, tables, inline/fenced code and compact highlighting. Raw HTML is escaped.
- **Defense in depth**: HTML allow-list sanitization, hostile URL rejection, no inline SVG, no event handlers, lazy images, atomic fragment rendering.
- **Search**: local progressive index; `Cmd/Ctrl+K` dialog; title/heading/full-text scoring; no server or third-party service.
- **Responsive navigation**: collapsible sidebar, session-scoped expansion state, modal mobile drawer and contextual TOC.
- **Accessibility**: semantic landmarks, skip link, visible focus, live page announcements, keyboard search/drawer controls and reduced-motion support.
- **Themes**: `nimbus`, `midnight`, `paper`, adaptive `auto`, and warm **`sabbia`**—inspired by Shootly’s sand/taupe aesthetic. Token-only custom themes are supported.
- **Optional diagrams**: opt-in Mermaid rendering (`mermaid="on"`), lazy-loaded only when a page contains a diagram, in strict security mode.
- **Header links**: manifest-declared GitHub / LinkedIn / external links rendered as icons, left of the appearance toggle.
- **API reference link**: a pinned Swagger/OpenAPI link at the bottom of the sidebar.
- **Multilingual**: manifest-declared languages, per-page Markdown variants, a header language selector, localized UI strings, and graceful fallback.
- **Extensible carefully**: a small local plugin API for app-owned code, never remotely activated by content.

## Docsify parity and differences

Nimbly Docs covers the everyday Docsify experience and adds a stricter security and distribution model.

| Capability | Docsify | Nimbly Docs |
| --- | :---: | :---: |
| Nested sidebar, hash routing, deep links | ✓ | ✓ |
| Client-side search | ✓ | ✓ (progressive local index) |
| Page TOC, breadcrumbs, prev/next | ✓ | ✓ |
| Themes (light/dark) | ✓ | ✓ (4 palettes × light/dark/auto) |
| Code highlight + copy | ✓ | ✓ |
| Relative `.md` links → internal routes | ✓ | ✓ |
| Mermaid diagrams | plugin | ✓ (opt-in, lazy) |
| Remote plugins/themes | ✓ | ✗ by design |
| Embed arbitrary/remote files | ✓ | ✗ by design |
| Cover page | ✓ | ✗ (not yet) |
| **Single dependency-free ESM bundle** | ✗ | ✓ |
| **Validated, safe manifest contract** | ✗ | ✓ |
| **Allow-list HTML sanitization** | partial | ✓ |
| **Enforced gzip size budget + SRI** | ✗ | ✓ |
| **Configurable brand (title/logo) via attributes** | partial | ✓ |
| **Explicit public methods + DOM events** | partial | ✓ |
| **No cookies / telemetry / implicit CDN** | varies | ✓ |

Net result: practical parity on daily-use features, plus a stronger security, accessibility and distribution posture. The deliberate trade-off is no remote plugin/theme loading.

## Quick start

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="module" src="/assets/nimbly-docs.0.0.1.<hash>.min.js"></script>
  </head>
  <body>
    <nimbly-docs manifest="./index.json"></nimbly-docs>
  </body>
</html>
```

Place this adjacent `index.json` and its Markdown sources on the same static origin:

```json
{
  "version": "1.0",
  "title": "Acme Platform",
  "language": "en",
  "home": "overview",
  "sections": [{
    "id": "start",
    "title": "Get started",
    "pages": [{
      "id": "overview",
      "title": "Overview",
      "source": "./guide/overview.md"
    }]
  }]
}
```

`source` is always resolved relative to the manifest URL—not the script URL or the embedding page. A page may link to `./other.md`; when that URL matches a known manifest page, Nimbly Docs turns it into an internal route.

## Installation and development

### Prerequisites

- Node.js **18+** (Node 20 LTS recommended)
- An evergreen browser supporting Web Components, Shadow DOM, `fetch`, `AbortController`, `URL`, and ES modules

### Build from this repository

```bash
npm ci
npm run build       # dist/ bundle + hash + .map + .sha384 + declarations
npm run size        # gzip/brotli budget verification
npm run pages       # copy the stable bundle to docs/assets for demo hosting
npm run serve       # static server at http://localhost:8082/docs/
```

Build dependencies are pinned in `package-lock.json`; none are bundled as production runtime dependencies. `npm run build` prints the immutable filename and SRI string. Use that filename in production, not an unpinned “latest” URL.

## Web Component contract

```html
<nimbly-docs
  manifest="./index.json"
  title="Acme Operations"
  logo="./assets/acme-mark.svg"
  theme="sabbia"
  appearance="auto"
  locale="en"
  router="hash"
  search="on"
  toc="auto"
  sidebar="auto"
  debug="false"
></nimbly-docs>
```

| Attribute | Default | Values / behavior |
| --- | --- | --- |
| `manifest` | `./index.json` | Relative or absolute HTTP(S) manifest URL. Do not supply it from an untrusted query parameter. |
| `title` | manifest title, then `Nimbly Docs` | Optional application name for the header brand. |
| `logo` | built-in book glyph | Optional relative or absolute logo URL; a failed image falls back to the built-in glyph. |
| `theme` | manifest theme, then `nimbus` | Palette: `nimbus`, `midnight`, `paper`, `sabbia`, or a manifest custom palette. Legacy `light`/`dark`/`auto` values remain accepted as appearance aliases. |
| `appearance` | `auto` | `light`, `dark`, or `auto`. It controls only the colour-scheme, never changes the selected palette. |
| `locale` | manifest `language` | UI locale hint; content remains authored Markdown. |
| `router` | `hash` | `hash` only in v1. |
| `search` | `on` | Enables local search when the manifest permits it. |
| `toc` | `auto` | `auto`, `on`, `off`. Creates a TOC from `h2`–`h4`. |
| `sidebar` | `auto` | `auto`, `open`, `closed`; desktop/sidebar behavior is CSS-first. |
| `debug` | `false` | Logs local diagnostics only; never enable as a production observability mechanism. |

### Methods

```ts
const viewer = document.querySelector<NimblyDocsElement>("nimbly-docs")!;
viewer.navigate("api/orders", "create-an-order");
viewer.setTheme("midnight");      // palette
viewer.setAppearance("dark");     // light | dark | auto
viewer.openSearch();
await viewer.reload();
```

| Method | Description |
| --- | --- |
| `navigate(id, anchor?)` | Changes to `#/id` or `#/id#anchor`. |
| `reload()` | Re-fetches and revalidates the manifest. |
| `setTheme(name)` | Applies and locally persists a valid theme; returns its applied name. |
| `openSearch()` | Opens the progressive local search dialog. |

### Events

All events bubble and are composed, so the host app can listen on the custom element:

```ts
viewer.addEventListener("docs-ready", ({ detail }) => console.info(detail.title));
viewer.addEventListener("docs-navigate", ({ detail }) => console.info(detail.id, detail.url));
viewer.addEventListener("docs-error", ({ detail }) => console.warn(detail.code, detail.message));
```

| Event | Detail |
| --- | --- |
| `docs-ready` | `{ title, version }` after manifest validation and shell render. |
| `docs-navigate` | `{ id, url }` after a document is rendered. |
| `docs-error` | `{ code, message, cause? }`; UI messages are safe for production, technical causes are only for the host/debugging. |

## Manifest v1

The published illustrative schema is [`docs/manifest.schema.json`](docs/manifest.schema.json). The bundled validator additionally enforces runtime URL and semantic checks.

```jsonc
{
  "$schema": "https://your-host.example/docs/manifest.schema.json",
  "version": "1.0",                    // required, major must be 1
  "title": "Portale Ordini",            // required
  "description": "Technical reference",
  "language": "it",
  "theme": "corporate",
  "logo": "./assets/logo.svg",
  "home": "overview",
  "footer": "Internal documentation",
  "editBase": "https://github.example/org/repo/blob/main/docs/",
  "features": {
    "search": true,
    "toc": true,
    "copyCode": true,
    "previousNext": true,
    "breadcrumbs": true,
    "sidebar": { "collapsible": true, "defaultExpanded": ["start"] }
  },
  "themes": [{
    "name": "corporate",
    "base": "nimbus",
    "light": { "color-brand": "#005ea8", "color-brand-strong": "#00497f" }
  }],
  "sections": [{
    "id": "start",
    "title": "Start here",
    "pages": [{
      "id": "overview",
      "title": "Overview",
      "source": "./guide/overview.md",
      "description": "Shown in search until the page is indexed",
      "badge": "new",
      "hidden": false
    }]
  }]
}
```

### Header links, API reference and languages (v0.0.2)

```jsonc
{
  "links": [
    { "type": "github",   "url": "https://github.com/acme/docs" },
    { "type": "linkedin", "url": "https://www.linkedin.com/company/acme" },
    { "type": "external", "url": "https://acme.example", "label": "Website" }
  ],
  "apiReference": { "url": "https://api.acme.example/swagger", "label": "API reference" },
  "languages": [
    { "code": "en", "label": "English" },
    { "code": "it", "label": "Italiano" }
  ],
  "sections": [{
    "id": "start", "title": "Start",
    "pages": [{
      "id": "intro", "title": "Introduction",
      "source": "./intro.md",
      "sources": { "en": "./intro.md", "it": "./it/intro.md" }
    }]
  }]
}
```

- **`links`**: header icons (github/linkedin/external; unknown types use a generic icon). URLs must be `https:` with no credentials; they open in a new tab with `rel="noopener noreferrer"`.
- **`apiReference`**: a single pinned link at the bottom of the sidebar for Swagger/OpenAPI or any external reference. Nimbly Docs links to it rather than embedding a heavy renderer.
- **`languages`** + per-page **`sources`**: the header shows a language selector when two or more languages are declared. The active locale selects the page's `sources[locale]`, falling back to `source`. UI strings are localized from a built-in dictionary (en, it, es, fr, de) with English fallback; the choice is stored under `nimbly-docs:locale`.

A small, tasteful **"Powered by Nimbly Docs"** footer is always rendered and is not configurable away; your own `footer` text renders above it.

### Validation and limits

- `version`, `title`, at least one section, and at least one page are mandatory.
- Page and section ids are globally unique and match `^[a-z0-9][a-z0-9/_-]{0,127}$`.
- A maximum of **500 pages**, **256 KB manifest** and **2 MB Markdown page** is enforced by default.
- Page sources resolve only as HTTP(S) URLs; credentials and token-like query parameters are rejected.
- A section supports one nested subsection level in v1.
- Unknown fields are not interpreted as behavior. This permits additive metadata without accidentally enabling execution.

## Markdown

Nimbly Docs intentionally implements a focused, deterministic Markdown dialect:

| Supported | Deliberately not supported |
| --- | --- |
| ATX headings, paragraphs, emphasis, inline code | Raw HTML passthrough |
| Links, autolinks, images | Arbitrary embedded iframe/object/form |
| Unordered/ordered/nested/task lists | JavaScript execution or MD plugins loaded by content |
| Blockquotes, rules, fenced/indented code | Inline SVG in Markdown |
| GFM-style tables | Full syntax-highlighting engines |

Heading ids are stable slugs. The view uses routes in the form `#/page-id#heading-id`; the hash is retained across a refresh and copy/paste. External links are sanitized and receive `target="_blank" rel="noopener noreferrer"`; relative links are resolved against their current Markdown URL.

## Themes and host customization

### Included themes

| Theme | Description |
| --- | --- |
| `nimbus` | Clean neutral palette with explicit light and dark variants. |
| `midnight` | Deep navy palette with explicit light and dark variants. |
| `paper` | High-contrast editorial palette with explicit light and dark variants. |
| `sabbia` | Warm off-white, taupe and umber palette inspired by Shootly, with a dark counterpart. |

A palette (`theme`) and an appearance (`light`, `dark`, `auto`) are independent. The header control changes **only** appearance in the deterministic order `light → dark → auto`; it never changes the palette. `auto` follows live `prefers-color-scheme` changes. The two choices are stored separately as `nimbly-docs:theme` and `nimbly-docs:appearance` in `localStorage` when available. No cookie is used.

### Header brand

The header uses the manifest `title` and optional `logo` by default. Override either for an embedding application without changing the manifest:

```html
<nimbly-docs
  manifest="./index.json"
  title="Acme Operations"
  logo="./assets/acme-mark.svg"
  theme="sabbia"
  appearance="dark">
</nimbly-docs>
```

If no title is available, the component uses **Nimbly Docs**. If a configured logo fails to load, it restores the built-in book glyph.

Custom manifest themes can override only approved token names with simple validated values:

```json
{
  "themes": [{
    "name": "ocean",
    "base": "nimbus",
    "light": {
      "color-bg": "#f5fbff",
      "color-text": "#102a43",
      "color-brand": "#0077b6",
      "color-brand-strong": "#005f92",
      "content-max-width": "78ch"
    }
  }]
}
```

The component exposes `::part(header)`, `::part(brand)`, `::part(sidebar)`, `::part(main)`, `::part(content)` and `::part(toc)`. Host pages may also set CSS custom properties:

```css
nimbly-docs {
  --dv-color-brand: #005ea8;
  --dv-font-body: system-ui, sans-serif;
  --dv-content-max-width: 76ch;
}
```

## Security model

Nimbly Docs is designed to render untrusted documentation defensively. Its mandatory pipeline is:

```text
Markdown (raw HTML disabled) → renderer → DOM allow-list sanitizer → DocumentFragment → atomic mount
```

The sanitizer removes scripts, styles, forms, iframes, objects, embeds, inline SVG, `on*` handlers and inline styles. It rejects `javascript:`, `data:`, `vbscript:`, `file:` and `blob:` URLs. Images are lazy, async-decoded and accept relative or HTTPS URLs by default. Code blocks are always text.

The library does **not** solve authentication. Keep protected docs behind the application’s SSO/reverse proxy; never put credentials or access tokens in a manifest `source`. Prefer same-origin hosting. For cross-origin content, configure explicit CORS on the content origin and use a pinned bundle with SRI.

Suggested baseline CSP:

```text
default-src 'self'; script-src 'self'; style-src 'self';
img-src 'self' https:; connect-src 'self'; object-src 'none';
base-uri 'self'; frame-ancestors 'self';
```

Adjust `connect-src` and `img-src` only for origins that are genuinely needed.

## Performance and caching

The build target is **≤120 KB gzip** for parser, sanitizer, UI, icons, themes, search and compact syntax highlighting in one bundle. `npm run size` is the release gate.

- The application shell appears before Markdown fetch completes.
- Current page fetches use `AbortController`; a fast second navigation cancels the previous request.
- Recent Markdown pages stay in a 10-entry in-memory LRU cache.
- Search progressively indexes pages when users visit them; title/description search works immediately.
- TOC uses `IntersectionObserver`; code highlighting stays intentionally compact.
- The component relies on HTTP ETag and server cache control, rather than duplicate persistent content storage.

Recommended response headers:

```text
# nimbly-docs.<version>.<contenthash>.min.js
Cache-Control: public, max-age=31536000, immutable

# index.json and *.md
Cache-Control: max-age=300, must-revalidate
```

## Local extensions

Register a local, reviewed extension **before** the element connects. This permits host integration without allowing a manifest to load arbitrary code:

```ts
import { NimblyDocsElement } from "/assets/nimbly-docs.min.js";

NimblyDocsElement.use({
  name: "app-release-context",
  setup({ manifest }) {
    console.info("Docs manifest loaded:", manifest.title);
  },
  transformHtml(html) {
    // Optional content transform. Sanitization always runs afterwards.
    return html;
  }
});
```

Keep plugins local, small and app-owned. `transformHtml` output is still sent through the sanitizer; plugins cannot relax the sanitizer’s allow-list.

## GitHub Pages demo

The repository contains a fully working demo under [`docs/`](docs/), and [`.github/workflows/pages.yml`](.github/workflows/pages.yml) does the following on pushes to `main`:

1. installs exactly the lockfile dependencies;
2. builds the single release bundle;
3. verifies the gzip budget;
4. copies the bundle into the Pages artifact;
5. deploys `docs/` using the official GitHub Pages actions.

In repository settings, set **Pages → Build and deployment → Source → GitHub Actions**. If you fork or rename this project, update the `asterd/nimbly-docs` references in the badge and URLs. The deployed demo is the same site as the local `docs/` demo, built with the current bundle.

## Hosting the bundle on GitHub

Yes — GitHub can host the final JavaScript. The viewer is a static ESM file, so there are two supported public-URL paths and you do not need any other service.

### 1. GitHub Pages CDN path (published on every push to `main`)

`npm run pages` also emits a stable, versioned copy under `docs/cdn/`, which Pages then serves publicly:

```html
<script type="module"
  src="https://asterd.github.io/nimbly-docs/cdn/nimbly-docs.0.0.1.min.js"
  crossorigin="anonymous"></script>
```

`nimbly-docs.latest.min.js` is also published for convenience; pin the versioned filename in production.

### 2. GitHub Releases via jsDelivr (published on every version tag)

Push a semver tag and [`.github/workflows/release.yml`](.github/workflows/release.yml) builds the bundle, verifies the budget, and creates a GitHub Release with the hashed bundle, its `.sha384` and source map attached:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow also publishes the built bundle to a dedicated `cdn` branch (because `dist/` is gitignored and therefore not present in the tag's git tree). jsDelivr serves that branch directly:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/gh/asterd/nimbly-docs@cdn/cdn/nimbly-docs.0.0.1.<hash>.min.js"
  crossorigin="anonymous"></script>
```

> Note: `https://cdn.jsdelivr.net/gh/asterd/nimbly-docs@vX.Y.Z/dist/…` does **not** work, because `dist/` is not committed on `main`. Use the `@cdn/cdn/…` path above, the GitHub Pages `/cdn/` path, or the bundle attached to the GitHub Release.

Both approaches are free, cacheable and versioned. For the strongest guarantees use Subresource Integrity (the `.sha384` value is attached to the release).

## Is `manifest.schema.json` required?

No. Manifest validation is compiled into the bundle and runs at load time, with stricter URL and semantic checks than JSON Schema can express. [`docs/manifest.schema.json`](docs/manifest.schema.json) is optional and exists only to power editor autocompletion and CI linting when referenced via `$schema`. Removing it changes nothing at runtime.

## Diagrams

Mermaid rendering is opt-in and lazy. Enable it with `mermaid="on"`; the library is imported (from a pinned URL you can override with `mermaid-src`) only on pages that contain a ` ```mermaid ` block, in Mermaid's `strict` security mode. This keeps the base bundle dependency-free and within budget. See the demo’s *Diagrams (Mermaid)* page for flowchart, sequence, class and state examples.

## Technical details

| Metric | Value |
| --- | --- |
| Raw (minified) | ~67 KB |
| **Gzip** | **~20 KB** |
| Brotli | ~18 KB |
| Gzip budget | 120 KB |
| Headroom | ~100 KB |

These figures cover the parser, sanitizer, search, UI, icons, all themes and highlighting; optional Mermaid is excluded because it loads lazily. `npm run size` prints exact numbers per build and gates releases. The deployed demo’s *Technical details* page reproduces this table.

## Browser support

Nimbly Docs targets currently supported evergreen Chromium, Firefox and Safari versions. It intentionally does not ship automatic polyfills or a legacy bundle. Organizations requiring legacy browser support should build and test a separate explicit legacy profile rather than diluting the modern bundle.

## Release checklist

- [ ] Update `version` using SemVer.
- [ ] Run `npm ci && npm run build && npm run typecheck && npm run size`.
- [ ] Review `dist/nimbly-docs.<version>.<hash>.min.js.sha384` and publish the exact bundle/SRI pair.
- [ ] Verify the deployed host sends the expected MIME types (`text/javascript`, `application/json`, `text/markdown`) and cache headers.
- [ ] Smoke-test a static host: root route, deep route, refresh, back/forward, mobile drawer, keyboard search and a failed page request.
- [ ] Review dependency advisories and the final gzip size before release.

## License

[MIT](LICENSE) © Nimbly Docs contributors.
