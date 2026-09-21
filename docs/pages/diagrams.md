# Diagrams (Mermaid)

Nimbly Docs renders [Mermaid](https://mermaid.js.org/) diagrams from fenced ` ```mermaid ` blocks. Support is **opt-in** so the base bundle stays dependency-free and inside its size budget.

## Enabling it

Add the `mermaid` attribute. Mermaid is then imported lazily from a pinned URL, and only on pages that actually contain a diagram.

```html
<nimbly-docs manifest="./index.json" mermaid="on"></nimbly-docs>
```

Under a strict Content-Security-Policy, self-host the library and point to it:

```html
<nimbly-docs
  manifest="./index.json"
  mermaid="on"
  mermaid-src="/vendor/mermaid.esm.min.mjs">
</nimbly-docs>
```

Diagrams are parsed with Mermaid's `strict` security level, so diagram text cannot execute scripts or inject raw HTML. Diagrams also follow the active light/dark appearance.

## Flowchart

```mermaid
flowchart TD
    A[Browser loads bundle] --> B{Manifest valid?}
    B -- No --> E[Accessible error + retry]
    B -- Yes --> C[Render shell]
    C --> D[Resolve hash route]
    D --> F[Fetch Markdown]
    F --> G[Parse and sanitize]
    G --> H[Mount atomically]
    H --> I{Contains mermaid?}
    I -- Yes --> J[Lazy-load Mermaid and render SVG]
    I -- No --> K[Done]
```

## Sequence diagram

```mermaid
sequenceDiagram
    participant U as User
    participant V as nimbly-docs
    participant S as Static host
    U->>V: Open #/api/orders
    V->>S: GET orders.md (AbortController)
    S-->>V: 200 Markdown
    V->>V: Parse → sanitize → mount
    V-->>U: docs-navigate { id, url }
```

## Class diagram

```mermaid
classDiagram
    class NimblyDocsElement {
      +navigate(id, anchor?)
      +setTheme(name)
      +setAppearance(value)
      +openSearch()
      +reload()
    }
    class ThemeManager {
      +setTheme()
      +setAppearance()
      +cycleAppearance()
    }
    class SearchController {
      +open()
      +index()
    }
    NimblyDocsElement --> ThemeManager
    NimblyDocsElement --> SearchController
```

## State diagram

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Ready: manifest valid
    Loading --> Error: manifest invalid
    Ready --> Navigating: hash change
    Navigating --> Ready: page rendered
    Navigating --> Error: fetch failed
    Error --> Loading: retry
```

If a diagram fails to parse, the original code block is preserved so the page is never left blank.
