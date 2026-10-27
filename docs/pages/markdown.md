# Markdown features

Nimbly Docs supports a focused, deterministic Markdown dialect that is appropriate for product and technical documentation.

## Inline formatting

Use **strong text**, *emphasis*, ~~deletions~~, `inline code`, links like [the API guide](./api.md), and images:

![Illustrative placeholder: warm sand gradient](../assets/placeholder.svg "A local SVG file used as an image resource")

## Lists and tasks

- Safe links are resolved against the current Markdown file.
- Links to known Markdown pages become internal routes.
  - Browser history is preserved.
  - The source file is not refetched on back/forward when in the LRU cache.

- [x] Manifest validated
- [x] Search indexed locally
- [ ] Publish your own documentation

## Code

```ts
const viewer = document.querySelector<NimblyDocsElement>("nimbly-docs");
viewer?.addEventListener("docs-navigate", ({ detail }) => {
  console.info("Rendered", detail.id);
});
```

```json
{
  "features": {
    "search": true,
    "toc": true,
    "copyCode": true
  }
}
```

Use the copy control on a code block. It uses the Async Clipboard API with a narrow DOM fallback.

Add a title after the language to show a header bar, with either `title="…"` or `[…]`:

```bash title="Install"
npm install nimbly-docs
```

## Tables

| Markdown construct | Rendered semantic element |
| --- | --- |
| Headings | `h1` through `h6` |
| Lists | `ul`, `ol`, `li` |
| Code | `pre`, `code` |
| Tables | `table`, `thead`, `tbody`, `th`, `td` |

## Blockquotes and callouts

> Blockquotes are useful for quotations and asides. They have no special runtime behavior and cannot execute code.

For highlighted notes, use a callout directive (`:::tip`) or a GitHub alert (`> [!NOTE]`):

> [!TIP]
> Tabs, code groups, steps and cards are covered in [Interactive components](./components.md).

See [Security model](./security.md) for the deliberate exclusions from the Markdown format.
