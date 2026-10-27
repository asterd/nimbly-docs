# Technical details

Nimbly Docs is a single ESM bundle with no runtime dependencies. The figures below come from `npm run size`, which also runs as a release check.

## Bundle size

| Metric | Value |
| --- | --- |
| Raw (minified) | ~120 KB |
| **Gzip** | **~33 KB** |
| Brotli | ~29 KB |
| Gzip budget | 120 KB |
| Headroom | ~87 KB |

The gzip size covers the Markdown parser, the sanitizer, search, the UI, icons, all themes and the syntax highlighter. The diagram engine is not included: it is loaded separately, and only on pages that contain a diagram when diagrams are enabled.

`npm run build` and `npm run size` print the exact size of each build, and CI fails if it goes over budget.

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

Each build produces files with a content hash in the name, safe to cache forever:

```text
dist/nimbly-docs.<version>.<hash>.min.js
dist/nimbly-docs.<version>.<hash>.min.js.map
dist/nimbly-docs.<version>.<hash>.min.js.sha384
```

Serve the hashed file with `Cache-Control: public, max-age=31536000, immutable`. If it comes from another origin, pin it with Subresource Integrity.

## Runtime characteristics

- No cookies, no telemetry, no web fonts. The only remote request the viewer can make on its own is the diagram engine, and only when you enable it.
- The manifest and the last 10 Markdown pages are cached in memory.
- Page titles and descriptions are searchable right away; page text is indexed when the browser is idle.
- The table of contents tracks the visible heading with `IntersectionObserver`.

## Browser targets

Current versions of Chromium, Firefox and Safari. No polyfills are included; if you need older browsers, make a separate build for them.

## Performance targets

- The header and sidebar appear before the first page has loaded.
- Navigating again cancels the previous page request.
- The layout doesn't shift while a page loads, thanks to placeholders.
