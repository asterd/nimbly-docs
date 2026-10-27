# Versioned docs

Software ships in versions, and so should its documentation. Nimbly Docs can serve several documentation versions side by side. Readers switch between them from the header, and pages of older or upcoming versions show a clear banner.

:::tip Try it
Open the version selector next to the logo and pick **v0.0.5**. That is the real documentation of the previous release, frozen with the snapshot command described below.
:::

## How it works

Each version is a complete, independent documentation tree with its own manifest, pages, languages and theme. The **root manifest**, the one in the element's `manifest` attribute, lists the versions:

```json title="index.json"
{
  "versions": [
    { "id": "2.x", "label": "v2.x (latest)", "status": "current" },
    { "id": "next", "label": "Next", "manifest": "./versions/next/index.json", "status": "unreleased" },
    { "id": "1.x", "label": "v1.x", "manifest": "./versions/1.x/index.json", "status": "legacy" }
  ]
}
```

| Field | Required | Meaning |
| --- | :---: | --- |
| `id` | ✓ | Stable id used in routes. Letters, digits, `.`, `_` and `-`, up to 32 characters. |
| `label` | | Text in the selector; defaults to `id`. |
| `manifest` | | The version's manifest, relative to the root manifest. Exactly one entry must omit it: the version the root manifest describes itself. |
| `status` | | `current` (default), `legacy` or `unreleased`. It controls the selector tag and the banner. |

Version manifests are plain v1 manifests. Any `versions` list inside them is ignored: the root is the single source of truth.

## Routes

The default version keeps the usual routes. Other versions add an `@id` segment, so every page of every version has its own deep link:

```text
#/installation              → default version
#/@1.x/installation         → version 1.x
#/@1.x/installation#cdn     → version 1.x, "cdn" heading
```

When a reader switches version, Nimbly Docs keeps the current page if it exists in the target version. Otherwise it opens that version's home page. An unknown version id falls back to the default version.

## What readers see

- **Version selector.** A compact control next to the brand, shown when at least two versions are declared. Non-current versions are tagged `legacy` or `unreleased`.
- **Banner.** Pages of a `legacy` version say the docs are no longer maintained. Pages of an `unreleased` version say the docs are not released yet. Both link to the same page in the default version. The banner text is localized.
- **Per-version everything.** Search, sidebar, languages and the manifest's default theme all follow the active version.

## Freeze a release

The snapshot command copies the current docs into `versions/<id>/` and registers the copy in the root manifest:

```bash
npx nimbly-docs-version 1.x --docs docs --label "v1.x"
# or, from a checkout of this repository
npm run version:snapshot -- 1.x --docs docs
```

It copies `index.json`, `pages/` and image assets (never the viewer bundle) into `docs/versions/1.x/`. The root manifest then gets a `legacy` entry, plus a `current` entry for itself if it has none. Use `--status`, `--current` and `--current-label` to control the generated entries.

:::note
The command rewrites the root `index.json` with standard two-space formatting. Review the diff before committing.
:::

## Element API

```ts
docs.setVersion("1.x");             // switch, keeping the page when possible
docs.addEventListener("docs-navigate", (e) => console.log(e.detail.version));
```
