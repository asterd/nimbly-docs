# Markdown features

Nimbly Docs supports the Markdown you need for technical documentation: GitHub-style tables, task lists, fenced code and alerts. Raw HTML is not supported.

## Inline formatting

Use **strong text**, *emphasis*, ~~deletions~~, `inline code`, links like [the API guide](./api.md), and images:

![Illustrative placeholder: warm sand gradient](../assets/placeholder.svg "A local SVG file used as an image resource")

## Lists and tasks

- Relative links are resolved against the Markdown file they appear in.
- Links to other pages in the manifest become internal routes.
  - Back and forward work as usual.
  - Recently viewed pages come from an in-memory cache and are not downloaded again.

Start an item with `[ ]` or `[x]` to get a task list:

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

Each block has a copy button. It uses the Clipboard API, with an older copy method as a fallback for browsers that lack it.

To show a title bar above a block, add `title="…"` or `[…]` after the language:

```bash title="Install"
npm install nimbly-docs
```

## Tables

| Markdown | HTML element |
| --- | --- |
| Headings | `h1` to `h6` |
| Lists | `ul`, `ol`, `li` |
| Code | `pre`, `code` |
| Tables | `table`, `thead`, `tbody`, `th`, `td` |

## Blockquotes and callouts

> A plain blockquote, for quotations and asides.

For notes and warnings, use a callout directive (`:::tip`) or a GitHub alert (`> [!NOTE]`):

> [!TIP]
> Tabs, code groups, steps, cards and badges are described in [Interactive components](./components.md).

[Security model](./security.md) lists what the format leaves out and why.
