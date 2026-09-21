# Technical details

Nimbly Docs is one self-contained ESM bundle with no runtime dependencies. These figures come from the `npm run size` release gate.

## Bundle size

| Metric | Value |
| --- | --- |
| Raw (minified) | ~67 KB |
| **Gzip** | **~20 KB** |
| Brotli | ~18 KB |
| Gzip budget | 120 KB |
| Headroom | ~100 KB |

The gzip figure includes the Markdown parser, HTML sanitizer, search, UI shell, icons, all themes and the compact syntax highlighter. Optional Mermaid support is **not** counted here: it is imported lazily and only when enabled and used.

> The exact size for a given release is printed by `npm run build` / `npm run size` and enforced in CI.

## What is inside the bundle

| Module | Responsibility |
| --- | --- |
| `manifest` | Validation and normalization of `index.json` |
| `router` | Hash routing, deep links, anchors |
| `loader` | Fetch with `AbortController`, timeout, one retry, in-memory LRU |
| `markdown` | Deterministic parser (no raw HTML) |
| `sanitize` | Allow-list HTML sanitizer |
| `highlight` | Compact multi-language syntax highlighting |
| `render` | Parse → sanitize → link rewrite → mount |
| `shell` / `sidebar` / `toc` / `search` | UI and navigation |
| `theme` | Palette + light/dark/auto appearance |
| `a11y` | Focus and live-region helpers |

## Release artifacts

Each build produces immutable, cacheable files:

```text
dist/nimbly-docs.<version>.<hash>.min.js
dist/nimbly-docs.<version>.<hash>.min.js.map
dist/nimbly-docs.<version>.<hash>.min.js.sha384
```

Serve the hashed file with `Cache-Control: public, max-age=31536000, immutable` and pin it with Subresource Integrity when cross-origin.

## Runtime characteristics

- No cookies, no telemetry, no implicit remote fonts or CDN calls (Mermaid is the only optional, explicit remote import).
- In-memory LRU caches the manifest and the last 10 Markdown pages.
- Search indexes page bodies during idle time; titles/descriptions are searchable immediately.
- TOC uses `IntersectionObserver`; content is mounted atomically via a `DocumentFragment`.

## Browser targets

Current evergreen Chromium, Firefox and Safari. No automatic polyfills; build a separate explicit legacy profile if older browsers are required.

## Performance targets

- Shell visible before Markdown fetch completes.
- Fast navigation cancels the previous page request.
- No layout shift thanks to a stable shell and skeletons.
