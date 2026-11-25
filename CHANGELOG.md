# Changelog
## 0.0.11
- `archify-embed`: after a link inside a diagram opens another one in the same
  frame, the bar shows **Back to start**. Archify hides its own back control in
  the embedded view, so the plugin provides the way back.
- Docs: corrected the Back behaviour in the Archify guide.
## 0.0.10
- Optional **Archify diagram plugin** (`archify-embed`, separate ~2.5 KB gzip file;
  the core bundle is byte-for-byte unchanged). A Markdown link titled
  `archify` becomes a sandboxed, theme-aware frame for an
  [Archify](https://github.com/tt-a1i/archify) diagram. Opt-in with
  `archify-base`; same-origin `.html` files under that folder only; no
  `allow-same-origin`; without the plugin the link keeps working.
  - `ratio=W:H` keeps the proportions at any column width, `height=px` fixes it.
  - **Expand** covers the window and loads Archify's full viewer (search, route
    tracing, export); `Esc` returns to the clean in-page view.
  - Light/dark follows the page and is re-applied on change.
- Core: the stylesheet is installed as a constructable stylesheet, so the strict
  `style-src 'self'` policy recommended in the docs now works. An inline
  `<style>` is only the fallback for engines without `adoptedStyleSheets`.
  Size is unchanged (gzip ~51 KB).
- `nimbly-docs-init --archify` scaffolds a project wired for diagrams.
- Release and Pages publish `archify-embed.<version>.<hash>.min.js` (+ map and
  SHA-384) next to the core bundle.
- Docs: new *Archify diagrams* guide (install, generation, evidence, themes,
  CSP, CI), security notes, and corrected bundle-size figures. v0.0.9 docs are
  frozen as legacy.

## 0.0.9

- Integrated, read-only API reference for OpenAPI 3.x and Swagger 2.0, in
  JSON or YAML, from local or remote files: per page (`api`) at any navigation
  depth, or behind the pinned sidebar link (`apiReference.spec`). Tag groups,
  method badges, parameters, request bodies, responses, schema trees with
  `$ref` links, generated examples, endpoint filter and expand/collapse.
  Operation bodies render lazily, so large specs stay fast.
- Built-in minimal YAML reader (block/flow collections, block scalars,
  anchors and merge keys) — no runtime dependency.
- External sidebar entries (`link`).
- Section badges at any navigation level, including top-level sections.
- Downloads: groups stack with an even card grid, lighter file cards with
  size (and origin for external files) under the title, no heading for a
  single group, and full-width toolbar buttons on mobile.
- In-page image viewer: images, image links and diagrams open in a
  full-screen, mobile-ready carousel with swipe, pinch, double-tap and wheel
  zoom, pan and keyboard controls (`features.lightbox`, on by default).
- Anchor-only navigation within the current page no longer re-renders it.
- The bundled stylesheet is now minified.

## 0.0.8

- Four nested navigation levels with independent collapse state, active
  ancestry expansion and consistent indentation.
- Static attachment catalogs, section inheritance, grouped download panels
  and optional current-page Markdown downloads.
- Document toolbar: status badges plus "Version and sources" and "Downloads"
  toggles that stay in place while their panel opens below (one at a time,
  `Escape` closes and restores focus). Files render as cards with a format
  chip, description, size and a download or external-link affordance.
- Optional inherited document revisions and explicit semantic badge tones.
- Mobile palette selection and keyboard-accessible palette menus.
- Public styling parts for document controls and a sidebar-width token.
- Docs: v0.0.7 frozen as legacy.
- Existing v1 manifests and string badges remain supported. No runtime
  dependency or backend has been added.
