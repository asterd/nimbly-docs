# Interactive components

Besides plain Markdown you can use callouts, tabs, code groups, steps, cards, collapsible sections and badges. Each example on this page is followed by its source.

:::note Why not MDX?
MDX compiles JSX to JavaScript and runs it in the page. Nimbly Docs never runs code from content, so it uses **directives** instead: plain text blocks that the parser turns into safe HTML. The viewer adds buttons and keyboard handling afterwards.
:::

## Directive syntax

A directive starts with `:::name` and ends with a line containing only `:::`. Directives can be nested; each `:::` closes the innermost open one. A `:::` line inside a fenced code block is ignored.

```md
:::name Optional title {key=value other="quoted value"}
Any **Markdown**, including other directives.
:::
```

An unknown directive name is not an error. Its content is rendered as normal Markdown.

## Callouts

There are five kinds: `note`, `tip`, `important`, `warning` and `danger`. `info`, `success`, `caution` and `error` work as aliases. Without a title, the callout shows its kind in the reader's language.

:::tip
Press `⌘K` (or `Ctrl K`) to search. The index is built in the browser as you read.
:::

:::important Keep content declarative
Titles and attributes are escaped like any other Markdown text.
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

GitHub alerts are rendered the same way, so Markdown written for GitHub looks the same here:

> [!NOTE]
> This callout was written as `> [!NOTE]`. `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]` and `[!CAUTION]` also work.

## Tabs

Put `:::tab Label` blocks inside a `:::tabs` block. Use the arrow keys, `Home` and `End` to move between tabs.

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

### Synced tabs

Each tab group works on its own. To make several groups switch together, give them the same `sync` key. The reader's choice is saved in local storage and restored on other pages. The group below also uses `sync=os`, so picking **Linux** above selects it here too:

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

`:::code-group` turns the fenced blocks inside it into tabs. Each tab is named after the block's title (`title="…"` or `[…]` after the language), or after its language if there is no title.

A code group works on its own by default:

:::code-group
```bash title="npm"
npm install nimbly-docs
```
```bash title="pnpm"
pnpm add nimbly-docs
```
```bash title="yarn"
yarn add nimbly-docs
```
:::

````md
:::code-group
```bash title="npm"
npm install nimbly-docs
```
```bash [pnpm]
pnpm add nimbly-docs
```
:::
````

### Switching language across a page

To let readers pick a language once for the whole page, give the groups the same `sync` key. Both groups below use `{sync=lang}`: choose **Python** in one and the other follows. The choice is remembered on later visits.

:::code-group {sync=lang}
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

:::code-group {sync=lang}
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
:::code-group {sync=lang}
```js title="JavaScript"
…
```
```python title="Python"
…
```
:::
````

Groups are matched by tab label, so use the same titles in every synced group.

## Code titles

A title also works on a single block. It appears as a bar above the code:

```ts title="src/main.ts"
import "./nimbly-docs.min.js";
```

## Steps

Wrap an ordered list in `:::steps` to show a numbered procedure:

:::steps
1. **Copy the bundle** into your static assets folder.
2. **Write `index.json`** next to your Markdown pages.
3. **Add the element** with `<nimbly-docs manifest="./index.json">`.
:::

## Cards

`:::cards` arranges `:::card` blocks in a grid. With an `href` attribute the card title becomes a link; links to Markdown pages open inside the viewer.

::::cards
:::card Installation {href="./installation.md"}
Add the bundle to any page.
:::
:::card Themes {href="./themes.md"}
Eight built-in themes, Nimbly Classic by default.
:::
:::card Versioned docs {href="./versions.md"}
Keep the docs of every release online.
:::
::::

## Details

:::details Show the full list of directives
`note`, `tip`, `important`, `warning`, `danger` (plus `info`, `success`, `caution`, `error`), `tabs` and `tab`, `code-group`, `steps`, `cards` and `card`, `details`.
:::

Add `{open}` to show a details block expanded.

## Badges

Write `:badge[text]` anywhere in a line to show a small label. In a heading it sits after the title: :badge[new] :badge[trial] :badge[deprecated] :badge[opt-in] :badge[v2]

```md
## Gantt charts :badge[trial]
```

The colour depends on the word: `new` and `stable` are green, `beta`, `trial`, `preview`, `experimental` and `alpha` are amber, `deprecated`, `legacy`, `removed` and `breaking` are red, `opt-in`, `optional`, `plugin`, `cli` and `api` are blue. Anything else is neutral. Colours follow the active theme. Badge text is left out of heading ids and the table of contents, so adding one doesn't break existing links.

The `badge` field of a page in the manifest uses the same colours in the sidebar.

## Security notes

- Directives only produce allow-listed tags (`div`, `p`, `span`, `details`, `summary`, `pre`, `code`) with `data-kind`, `data-label`, `data-sync` and `data-title` attributes.
- Buttons, ARIA roles and icons are added by the viewer after sanitization. Text you write only ever ends up as text or attribute values.
- Card links go through the same URL checks as every other link, so `javascript:` URLs are dropped.
