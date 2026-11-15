# Manifest reference

`index.json` describes a Nimbly Docs site: its title, navigation, features, themes, links, languages and where each page's Markdown file is. The viewer validates it on load. It contains data only, never code.

`manifest.schema.json` is optional. Reference it from `$schema` to get autocompletion in your editor or to lint the manifest in CI. The viewer does its own, stricter validation at runtime.

## Annotated example

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

  // Default theme: nimbly (default) | nimbus | midnight | paper | sabbia |
  // material | stellar | evergreen | a custom theme name.
  "theme": "nimbly",

  // Show a header palette selector for live switching. true = all built-ins;
  // an array narrows the offered palettes, e.g. ["nimbus","midnight"].
  "chooseThemes": true,

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

  // Optional documentation versions (root manifest only). Exactly one entry
  // omits "manifest": the version this file describes. See "Versioned docs".
  "versions": [
    { "id": "2.x", "label": "v2.x (latest)", "status": "current" },
    { "id": "1.x", "manifest": "./versions/1.x/index.json", "status": "legacy" }
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
      "base": "nimbly",
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
| `theme` |  | string | Built-in or custom theme name; defaults to `nimbly`. |
| `chooseThemes` |  | boolean \| string[] | Show a header palette selector; array narrows the choices. |
| `appearance` |  | enum | Default `light` / `dark` / `auto` (attribute overrides it). |
| `logo` |  | string | Relative/absolute image URL. |
| `home` |  | id | Page for the empty route (else first page). |
| `backLink` |  | object | `{ url, label? }` "back to app" link; `label` is localizable. |
| `footer` |  | string | Text above the fixed "Powered by" line. |
| `links` |  | array | Header icon links (see below). |
| `apiReference` |  | object | Pinned sidebar link `{ url, label? }`. |
| `languages` |  | array | `{ code, label }[]`; first is default. |
| `versions` |  | array | `{ id, label?, manifest?, status? }[]`; see [Versioned docs](./versions.md). |
| `features` |  | object | Feature switches. |
| `themes` |  | array | Custom themes (token maps); see [Themes](./themes.md) for the token list. |
| `sections` | ✓ | array | Navigation tree (≥1 section). |

### Sections

| Field | Required | Type | Notes |
| --- | :---: | --- | --- |
| `id` | ✓ | id | Globally unique, `^[a-z0-9][a-z0-9/_-]{0,127}$`. |
| `title` | ✓ | localizable | Shown in the sidebar. |
| `pages` |  | array | Page entries. |
| `sections` |  | array | One level of subsections. In the sidebar each one appears as a small caption above its pages. |
| `collapsed` |  | boolean | Start collapsed. |

### Pages

| Field | Required | Type | Notes |
| --- | :---: | --- | --- |
| `id` | ✓ | id | Globally unique; used in the route `#/id`. |
| `title` | ✓ | localizable | Sidebar and document title. |
| `source` |  | localizable | Path (or per-locale map). Optional with conventions. |
| `sources` |  | object | Alternative per-locale `{ locale: path }` map. |
| `description` |  | localizable | Search/summary text. |
| `badge` |  | string | Short label shown at the right of the sidebar entry. Coloured by its text (see below). |
| `hidden` |  | boolean | Routable but not listed. |

### Page badges

A `badge` is a short word such as `new` or `beta`. Its colour depends on the word:

| Words | Colour |
| --- | --- |
| `new`, `stable` | Green (tip colour) |
| `beta`, `trial`, `preview`, `experimental`, `alpha` | Amber (warning colour) |
| `deprecated`, `legacy`, `removed`, `breaking` | Red (danger colour) |
| `opt-in`, `optional`, `plugin`, `cli`, `api` | Blue (note colour) |
| anything else | Neutral |

The colours come from the active theme. The same badges can be used inside a page with `:badge[text]`; see [Interactive components](./components.md#badges).

### Links

`type` selects the icon: `github`, `linkedin` or `external`. Other values get a generic icon. `url` must use `https:` and can't contain credentials. Links open in a new tab with `rel="noopener noreferrer"`.

## Live palette selector

Set `chooseThemes` to add a theme menu to the header:

```jsonc
"chooseThemes": true                 // all built-in palettes
"chooseThemes": ["nimbus", "midnight", "sabbia"]   // a curated subset
```

Changing theme only swaps CSS tokens. The page is not fetched or rendered again. Theme and appearance are separate settings: the theme menu changes the colours, the appearance button switches between light and dark. The reader's choice is saved locally.

## Default appearance

`appearance` sets the starting colour scheme: `light`, `dark`, or `auto` to follow the operating system. It applies only when the element has no `appearance` attribute and the reader hasn't picked a scheme yet. Readers can always change it from the header, and their choice is saved locally.

## Back to application

If the docs are opened from another application, `backLink` adds a button at the start of the header that leads back to it:

```jsonc
"backLink": {
  "url": "https://app.example/dashboard",
  "label": { "en": "Back to app", "it": "Torna all'app" }
}
```

The label can be localized. Without one, the button reads "Back to app" in the reader's language. The URL can be absolute (`http(s)`) or a relative path. The logo still links to the documentation home.

## Localizable values

`title`, `description` and `source` accept either a single string or a `{ locale: value }` map:

```jsonc
"title": "Overview"
"title": { "en": "Overview", "it": "Panoramica" }
```

For the active locale the viewer picks, in order: the exact locale, the base language (`it` for `it-IT`), the default language, then the first value available. A missing translation never leaves a blank label.

## How page files are found

You don't have to write full paths. For each page the viewer tries a list of candidate URLs and uses the first one that answers. Relative links and images in the page are then resolved against that file.

For the default language:

1. the explicit `source` path (resolved against the manifest);
2. `pages/<filename>`.

For other languages, the localized folder is tried first so the default-language file doesn't hide it:

1. `pages/<locale>/<filename>`;
2. `pages/<base>/<filename>`;
3. the explicit `source` path;
4. `pages/<filename>`.

So `"source": "overview.md"` loads `pages/overview.md` in the default language and `pages/it/overview.md` when Italian is active. You don't need a `sources` map for each page.

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

Page ids can contain `/`, as in `api/orders`. Matching folders keep things tidy, but they aren't required.

## Validation and limits

- `version`, `title`, at least one section and one page are required.
- Ids must be unique across the manifest and match `^[a-z0-9][a-z0-9/_-]{0,127}$`.
- Default limits: 500 pages, 256 KB for the manifest, 2 MB per Markdown page.
- Sources must resolve to `http(s)` URLs. URLs with credentials or token-like query parameters are rejected.
- Sections can nest one level deep.
- Unknown fields are ignored, so you can add your own metadata.
