# Configuration

A site is configured in two places: the manifest (`index.json`) and a few attributes on the `<nimbly-docs>` element. The manifest has a fixed, validated shape, so it can describe your docs but can't run code.

:::note Do I need manifest.schema.json?
No. Validation is built into the bundle and runs when the manifest loads. It also checks URLs and references, which JSON Schema can't express. The schema file is only useful for editor autocompletion and CI linting through `$schema`.
:::

## Minimal manifest

```json
{
  "version": "1.0",
  "title": "My product docs",
  "home": "intro",
  "sections": [{
    "id": "start",
    "title": "Start here",
    "pages": [{
      "id": "intro",
      "title": "Introduction",
      "source": "./intro.md"
    }]
  }]
}
```

## Component attributes

| Attribute | Default | Accepted values |
| --- | --- | --- |
| `manifest` | `./index.json` | Relative or absolute HTTP(S) URL |
| `title` | Manifest title, then `Nimbly Docs` | Name shown in the header |
| `logo` | Built-in icon | Logo URL. If it fails to load, the built-in icon is shown |
| `theme` | Manifest theme, then `nimbly` | A built-in theme or a custom theme from the manifest |
| `appearance` | Manifest `appearance`, then `auto` | `light`, `dark` or `auto`. Changes the scheme, not the theme |
| `locale` | Manifest language | UI language |
| `router` | `hash` | Only `hash` in v1 |
| `search` | `on` | `on` / `off` |
| `toc` | `auto` | `auto` / `on` / `off` |
| `sidebar` | `auto` | `auto` / `open` / `closed` |
| `mermaid` | off | Enables [diagrams](./diagrams.md) when present |
| `mermaid-src` | Pinned CDN URL | Diagram engine URL, for self-hosting under a strict CSP |
| `debug` | `false` | Logs diagnostics to the console |

The [Manifest reference](./manifest.md) covers sections, pages, links, languages and path resolution. To generate a starter project, see [Start a new project](./scaffold.md).

## Routes and anchors

A page route is `#/page-id`. To link to a heading, add a second fragment: `#/page-id#heading-id`. Heading ids come from the heading text; duplicates get a numeric suffix.

```text
/docs/index.html#/configuration
/docs/index.html#/configuration#routes-and-anchors
```

After each navigation the viewer updates `document.title`, `aria-current`, the screen-reader announcement and keyboard focus.
