# Versioned docs

Nimbly Docs can publish the documentation of several releases side by side. Readers switch version from the header, and pages of old or unreleased versions show a banner.

:::tip Try it
Open the version menu next to the logo and pick **v0.0.5**. It contains the docs of the previous release, saved with the snapshot command described below.
:::

## How it works

Each version is a separate documentation tree with its own manifest, pages, languages and theme. The root manifest, the one set in the element's `manifest` attribute, lists all versions:

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

A version manifest is an ordinary v1 manifest. If it contains a `versions` list, it is ignored; only the root manifest's list counts.

## Routes

Pages of the default version keep the usual routes. Other versions add an `@id` segment, so every page of every version has its own link:

```text
#/installation              → default version
#/@1.x/installation         → version 1.x
#/@1.x/installation#cdn     → version 1.x, "cdn" heading
```

When the reader switches version, the viewer stays on the same page if it exists in that version, and opens the version's home page otherwise. An unknown version id falls back to the default version.

## What readers see

A version menu appears next to the logo when the manifest declares at least two versions. Versions that aren't current are tagged `legacy` or `unreleased` in the menu.

Pages of a `legacy` version show a banner saying the docs are no longer maintained; pages of an `unreleased` version say the docs describe a version that isn't out yet. Both banners link to the same page in the default version, and their text follows the reader's language.

Search, the sidebar, languages and the default theme all come from the active version's manifest.

## Freeze a release

The snapshot command copies the current docs to `versions/<id>/` and adds the copy to the root manifest:

```bash
npx nimbly-docs-version 1.x --docs docs --label "v1.x"
# or, from a checkout of this repository
npm run version:snapshot -- 1.x --docs docs
```

It copies `index.json`, `pages/` and image assets, but not the viewer bundle, into `docs/versions/1.x/`. The root manifest gets a `legacy` entry for the copy, and a `current` entry for itself if it doesn't have one yet. `--status`, `--current` and `--current-label` change the generated entries.

:::note
The command rewrites the root `index.json` with two-space indentation. Check the diff before you commit.
:::

## Element API

```ts
docs.setVersion("1.x");             // switch, keeping the page when possible
docs.addEventListener("docs-navigate", (e) => console.log(e.detail.version));
```
