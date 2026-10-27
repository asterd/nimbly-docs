# Interactive components

Nimbly Docs adds a small set of interactive building blocks on top of Markdown: callouts, tabs, code groups with a synced language switch, steps, cards and collapsible details. Everything on this page is rendered from the Markdown source next to it.

:::note Why not MDX?
MDX compiles JSX into JavaScript and executes it. That conflicts with the core guarantees of Nimbly Docs: no raw HTML, no script from content, a sanitizer allow-list, zero runtime dependencies and strict-CSP compatibility. **Directives** give you the same building blocks as plain, declarative text. The parser emits inert markup, and trusted viewer code attaches the behaviour afterwards.
:::

## Directive syntax

A directive starts with `:::name` and ends with a bare `:::` line. Nested directives close by depth, so you never need to count colons. A `:::` line inside a fenced code block is ignored.

```md
:::name Optional title {key=value other="quoted value"}
Any **Markdown** content, including nested directives.
:::
```

Unknown directive names are not an error: their content is rendered as plain Markdown.

## Callouts

Five kinds are available: `note`, `tip`, `important`, `warning` and `danger`. The aliases `info`, `success`, `caution` and `error` also work. If you leave the title out, the viewer uses a label in the reader's language.

:::tip
Press `⌘K` (or `Ctrl K`) to search. The index is built locally while you read.
:::

:::important Keep content declarative
Directive titles and attributes are escaped like any other Markdown text.
:::

:::warning Breaking change in 2.0
The `sidebar` attribute no longer accepts `true`. Use `open`.
:::

:::danger
Never commit credentials to a documentation repository.
:::

```md
:::tip
Press ⌘K to search.
:::

:::warning Breaking change in 2.0
The `sidebar` attribute no longer accepts `true`.
:::
```

GitHub-style alerts render as the same components, so Markdown written for GitHub reads the same here:

> [!NOTE]
> This callout was written as `> [!NOTE]`. `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]` and `[!CAUTION]` work too.

## Tabs

Put `:::tab Label` blocks inside a `:::tabs` container. Tabs follow the WAI-ARIA tabs pattern: arrow keys, `Home` and `End` move between tabs.

:::tabs {sync=os}
:::tab macOS
Install with Homebrew, then open the folder:

```bash
brew install node
open ./docs
```
:::
:::tab Windows
Install with winget:

```powershell
winget install OpenJS.NodeJS
```
:::
:::tab Linux
Use your distribution's package manager:

```bash
sudo apt install nodejs
```
:::
:::

```md
:::tabs {sync=os}
:::tab macOS
…
:::
:::tab Windows
…
:::
:::
```

### Synced choices

Tab groups that share a `sync` key switch together, and the reader's choice is saved in local storage. This one also uses `sync=os`, so selecting **Linux** above also selects it here:

:::tabs {sync=os}
:::tab macOS
`~/Library/Application Support/acme`
:::
:::tab Windows
`%APPDATA%\acme`
:::
:::tab Linux
`~/.config/acme`
:::
:::

## Code groups and language switch

A `:::code-group` turns consecutive fenced blocks into tabs. Each tab is labelled by the block's title (`title="…"` or `[…]` after the language), or else by its language. Code groups sync by default under the key `code`: pick **Python** once and every code group on the page switches to it. Use `{sync=none}` to opt out, or set your own key.

:::code-group
```js title="JavaScript"
const res = await fetch("/api/orders");
const orders = await res.json();
```
```python title="Python"
import requests
orders = requests.get("/api/orders").json()
```
```bash title="cURL"
curl -s https://example.com/api/orders
```
:::

:::code-group
```js title="JavaScript"
await fetch("/api/orders", { method: "POST", body: JSON.stringify(order) });
```
```python title="Python"
requests.post("/api/orders", json=order)
```
```bash title="cURL"
curl -X POST -d @order.json https://example.com/api/orders
```
:::

````md
:::code-group
```js title="JavaScript"
const orders = await (await fetch("/api/orders")).json();
```
```python [Python]
orders = requests.get("/api/orders").json()
```
:::
````

## Code titles

A title also works outside a group. It is shown as a header bar above the block:

```ts title="src/main.ts"
import "./nimbly-docs.min.js";
```

## Steps

Wrap an ordered list in `:::steps` to get a numbered, connected procedure:

:::steps
1. **Copy the bundle** into your static assets folder.
2. **Write `index.json`** next to your Markdown pages.
3. **Add the element** with `<nimbly-docs manifest="./index.json">`.
:::

## Cards

`:::cards` lays out `:::card` blocks in a responsive grid. With an `href` attribute, the card title becomes a link. Links to Markdown files become internal routes.

::::cards
:::card Installation {href="./installation.md"}
Add the single ESM bundle to any page.
:::
:::card Themes {href="./themes.md"}
Eight built-in palettes, including the new Nimbly Classic.
:::
:::card Versioned docs {href="./versions.md"}
Ship documentation for every release side by side.
:::
::::

## Details

:::details Show the full list of supported directives
`note`, `tip`, `important`, `warning`, `danger` (plus `info`, `success`, `caution`, `error`), `tabs` and `tab`, `code-group`, `steps`, `cards` and `card`, `details`.
:::

Add `{open}` to render a details block expanded.

## Security notes

- Directives only produce allow-listed tags (`div`, `p`, `details`, `summary`, `pre`, `code`) plus `data-kind`, `data-label`, `data-sync` and `data-title` attributes.
- Buttons, ARIA roles and icons are created by the viewer after sanitization. Authored values only ever reach text or attribute values.
- Card links pass through the same URL validation as every other link, so `javascript:` URLs are dropped.
