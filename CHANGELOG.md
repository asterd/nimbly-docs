# Changelog

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
