# Configuration

The manifest is the only project-level configuration. Its explicit, validated shape prevents configuration from becoming an execution channel.

> **Is `manifest.schema.json` required?** No. Validation is compiled into the bundle and runs at load time, including stricter URL and semantic checks than JSON Schema can express. The published `manifest.schema.json` is optional — it only powers editor autocompletion and CI linting when you reference it from `$schema`. Omitting it changes nothing at runtime.

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
| `title` | Manifest title, then `Nimbly Docs` | Header application name override |
| `logo` | Built-in glyph | Optional logo URL; falls back safely to the built-in glyph |
| `theme` | Manifest theme, then `nimbus` | Palette: built-in or manifest custom theme |
| `appearance` | manifest `appearance`, then `auto` | `light`, `dark`, or `auto`; affects scheme without swapping palette |
| `locale` | manifest language | UI locale hint |
| `router` | `hash` | `hash` in v1 |
| `search` | `on` | `on` / `off` |
| `toc` | `auto` | `auto` / `on` / `off` |
| `sidebar` | `auto` | `auto` / `open` / `closed` |
| `mermaid` | off | Presence enables opt-in Mermaid diagrams |
| `mermaid-src` | pinned CDN | Override the Mermaid ESM URL (self-host under strict CSP) |
| `debug` | `false` | Local diagnostic logging only |

For the full manifest structure — sections, pages, links, API reference, languages, per-locale sources and the convention-based path resolution — see **[Manifest reference](./manifest.md)**. To generate a ready-made project skeleton, see **[Start a new project](./scaffold.md)**.

## Routes and anchors

A page route is `#/page-id`. A heading is a second fragment: `#/page-id#heading-id`. Stable heading ids derive from the heading text and duplicate ids receive a numeric suffix.

```text
/docs/index.html#/configuration
/docs/index.html#/configuration#routes-and-anchors
```

The viewer updates `document.title`, `aria-current`, live announcements, and keyboard focus after navigation.
