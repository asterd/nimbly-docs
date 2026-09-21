# Manifest reference

`index.json` is the single source of truth for a Nimbly Docs site: it declares the title, navigation, features, themes, links, languages and where each page's Markdown lives. It is validated at load time and is intentionally declarative — it can describe documentation but never execute code.

> `manifest.schema.json` is **optional**. It only powers editor autocompletion and CI linting via `$schema`. Runtime validation is built into the viewer and is stricter than JSON Schema.

## A complete, annotated example

```jsonc
{
  // Optional: enables editor autocompletion when the schema file sits alongside.
  "$schema": "./manifest.schema.json",

  // Required. Manifest contract major must be 1.
  "version": "1.0",

  // Required. A string, or a per-locale map (see "Localizable values").
  "title": { "en": "Acme Platform", "it": "Piattaforma Acme" },

  // Optional. Shown in metadata/search; string or per-locale map.
  "description": "Technical and user documentation",

  // Default content language when no `languages` selector is used.
  "language": "en",

  // Default palette: nimbus | midnight | paper | sabbia | a custom theme name.
  "theme": "sabbia",

  // Optional brand logo (relative to the manifest). Falls back to a built-in glyph.
  "logo": "./assets/logo.svg",

  // Page id shown when the route is empty.
  "home": "overview",

  // Default appearance when the host sets no attribute and the user has no
  // stored preference: "light" | "dark" | "auto".
  "appearance": "auto",

  // Optional "back to application" link shown at the start of the header when
  // the docs are embedded in a host app. Label is localizable.
  "backLink": { "url": "https://app.acme.example", "label": { "en": "Back to app", "it": "Torna all'app" } },

  // Optional footer text rendered above the fixed "Powered by" line.
  "footer": "Internal documentation — Acme Inc.",

  // Header icons (left of the appearance toggle). https only, no credentials.
  "links": [
    { "type": "github",   "url": "https://github.com/acme/docs" },
    { "type": "linkedin", "url": "https://www.linkedin.com/company/acme" },
    { "type": "external", "url": "https://acme.example", "label": "Website" }
  ],

  // A single pinned link at the bottom of the sidebar (e.g. Swagger/OpenAPI).
  "apiReference": { "url": "https://api.acme.example/swagger", "label": "API reference" },

  // Declaring 2+ languages shows the header language selector. First is default.
  "languages": [
    { "code": "en", "label": "English" },
    { "code": "it", "label": "Italiano" }
  ],

  // Feature switches. All default to enabled except editLink.
  "features": {
    "search": true,
    "toc": true,
    "copyCode": true,
    "previousNext": true,
    "breadcrumbs": true,
    "sidebar": { "collapsible": true, "defaultExpanded": ["start"] }
  },

  // Optional custom palettes (validated token maps only; no CSS/URLs).
  "themes": [
    {
      "name": "corporate",
      "base": "nimbus",
      "light": { "color-brand": "#005ea8", "color-brand-strong": "#00497f" },
      "dark":  { "color-brand": "#7fb3ff" }
    }
  ],

  // Required. Ordered navigation. Sections may nest one level of subsections.
  "sections": [
    {
      "id": "start",
      "title": { "en": "Start here", "it": "Per iniziare" },
      "pages": [
        { "id": "overview", "title": "Overview", "source": "overview.md", "badge": "new" },
        { "id": "install",  "title": "Installation", "source": "install.md" }
      ]
    },
    {
      "id": "guides",
      "title": "Guides",
      "sections": [
        {
          "id": "guides-api",
          "title": "API",
          "pages": [
            { "id": "api/orders", "title": "Orders", "source": "api/orders.md" }
          ]
        }
      ]
    }
  ]
}
```

## Top-level fields

| Field | Required | Type | Notes |
| --- | :---: | --- | --- |
| `version` | ✓ | string | Manifest major must be `1`. |
| `title` | ✓ | localizable | Site title and default header brand. |
| `description` |  | localizable | Metadata/search text. |
| `language` |  | string | Default content language (default `en`). |
| `theme` |  | string | Built-in or custom palette name. |
| `appearance` |  | enum | Default `light` / `dark` / `auto` (attribute overrides it). |
| `logo` |  | string | Relative/absolute image URL. |
| `home` |  | id | Page for the empty route (else first page). |
| `backLink` |  | object | `{ url, label? }` "back to app" link; `label` is localizable. |
| `footer` |  | string | Text above the fixed "Powered by" line. |
| `links` |  | array | Header icon links (see below). |
| `apiReference` |  | object | Pinned sidebar link `{ url, label? }`. |
| `languages` |  | array | `{ code, label }[]`; first is default. |
| `features` |  | object | Feature switches. |
| `themes` |  | array | Custom palettes (token maps). |
| `sections` | ✓ | array | Navigation tree (≥1 section). |

### Sections

| Field | Required | Type | Notes |
| --- | :---: | --- | --- |
| `id` | ✓ | id | Globally unique, `^[a-z0-9][a-z0-9/_-]{0,127}$`. |
| `title` | ✓ | localizable | Shown in the sidebar. |
| `pages` |  | array | Page entries. |
| `sections` |  | array | One nested level of subsections. |
| `collapsed` |  | boolean | Start collapsed. |

### Pages

| Field | Required | Type | Notes |
| --- | :---: | --- | --- |
| `id` | ✓ | id | Globally unique; used in the route `#/id`. |
| `title` | ✓ | localizable | Sidebar and document title. |
| `source` |  | localizable | Path (or per-locale map). Optional with conventions. |
| `sources` |  | object | Alternative per-locale `{ locale: path }` map. |
| `description` |  | localizable | Search/summary text. |
| `badge` |  | string | Small tag next to the sidebar entry. |
| `hidden` |  | boolean | Routable but not listed. |

### Links

`type` selects the icon: `github`, `linkedin`, `external` (unknown types use a generic icon). `url` must be `https:` without embedded credentials; links open in a new tab with `rel="noopener noreferrer"`.

## Default appearance

`appearance` sets the initial colour scheme when neither the `appearance` HTML attribute nor a stored user preference is present:

- `light` / `dark` — force a scheme;
- `auto` — follow the operating system and react to live changes.

The header control always lets the reader override this, and their choice is remembered locally. The `appearance` attribute on `<nimbly-docs>` takes precedence over the manifest value.

## Back to application

When the docs are opened from a host application (for example as a docked page), declare `backLink` to render a clearly labelled button at the start of the header:

```jsonc
"backLink": {
  "url": "https://app.example/dashboard",
  "label": { "en": "Back to app", "it": "Torna all'app" }
}
```

The label is localizable and defaults to a translated "Back to app" when omitted. The link accepts an `http(s)` URL or a same-app relative path. The brand/logo intentionally keeps its role as the documentation home, so the return action is a separate, explicit control.

## Localizable values

`title`, `description` and `source` accept either a single string or a `{ locale: value }` map:

```jsonc
"title": "Overview"
"title": { "en": "Overview", "it": "Panoramica" }
```

Resolution order for the active locale: exact locale → base language (e.g. `it` from `it-IT`) → default language → first available value. A missing translation therefore never blanks the UI.

## Source resolution (convention over configuration)

`source` may be omitted-of-path detail: the viewer tries an ordered list of candidates and uses the first that responds. This keeps manifests short when you follow the standard layout.

For the **default** language:

1. the explicit `source` path (resolved against the manifest);
2. `pages/<filename>`.

For a **non-default** language, the localized folder wins first so it is never shadowed by the default file:

1. `pages/<locale>/<filename>`;
2. `pages/<base>/<filename>`;
3. the explicit `source` path;
4. `pages/<filename>`.

So `"source": "overview.md"` resolves to `pages/overview.md` in the default language and to `pages/it/overview.md` when Italian is active — no per-page `sources` map required.

## Recommended folder structure

```text
docs/
├─ index.html                # host page loading the viewer bundle
├─ index.json                # this manifest
├─ manifest.schema.json      # optional: editor/CI autocompletion
├─ assets/
│  ├─ nimbly-docs.min.js      # the viewer bundle
│  └─ logo.svg
└─ pages/
   ├─ overview.md            # default language (e.g. en)
   ├─ install.md
   ├─ api/
   │  └─ orders.md           # nested ids like "api/orders" mirror folders
   └─ it/                    # per-locale variants (same filenames)
      ├─ overview.md
      └─ install.md
```

Page `id`s may contain `/` (e.g. `api/orders`); mirroring that in folders keeps sources tidy, but it is a convention, not a requirement.

## Validation and limits

- `version`, `title`, at least one section and one page are mandatory.
- ids are globally unique and match `^[a-z0-9][a-z0-9/_-]{0,127}$`.
- Default limits: 500 pages, 256 KB manifest, 2 MB per Markdown page.
- Sources resolve only as `http(s)`; credentials and token-like query params are rejected.
- One nested subsection level is supported in v1.
- Unknown fields are ignored (never treated as behavior), so additive metadata is safe.
