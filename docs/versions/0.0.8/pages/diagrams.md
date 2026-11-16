# Diagrams

Write diagrams in [Mermaid syntax](https://mermaid.js.org/syntax/flowchart.html) inside a ` ```mermaid ` code block. Nimbly Docs renders them to SVG with [Pele](https://github.com/obsidianmd/pele), a small renderer for the Mermaid language. Mermaid.js itself is not loaded.

## Enable diagrams

Diagrams are off by default, so the base bundle stays small and has no dependencies. Turn them on with the `mermaid` attribute:

```html
<nimbly-docs manifest="./index.json" mermaid="on"></nimbly-docs>
```

Pele is imported from a pinned CDN URL, and only on pages that contain a diagram. If your Content-Security-Policy does not allow that CDN, host the file yourself and point to it:

```html
<nimbly-docs
  manifest="./index.json"
  mermaid="on"
  mermaid-src="/vendor/pele.js">
</nimbly-docs>
```

Diagram text is treated as data: it cannot run scripts or inject HTML. Colours come from the active theme's CSS variables, so diagrams follow light/dark mode and theme changes without being re-rendered.

If a block fails to parse, it stays on the page as a normal code block.

## Flowchart

```mermaid
flowchart TD
    A[Browser loads bundle] --> B{Manifest valid?}
    B -- No --> E[Show error and retry button]
    B -- Yes --> C[Render shell]
    C --> D[Resolve hash route]
    D --> F[Fetch Markdown]
    F --> G[Parse and sanitize]
    G --> H[Mount page]
    H --> I{Contains a diagram?}
    I -- Yes --> J[Load Pele and render SVG]
    I -- No --> K[Done]
```

You can style nodes and edges with `style`, `classDef` and `linkStyle`:

```mermaid
flowchart LR
  A[Draft] --> B[Review]:::warn --> C[Done]
  style C fill:#879a39,stroke:#66800b,color:#fffcf0
  classDef warn fill:#d0a215,stroke:#ad8301
  linkStyle 0 stroke:#878580,stroke-dasharray:4 4
```

## Sequence diagram

```mermaid
sequenceDiagram
    participant U as User
    participant V as nimbly-docs
    participant S as Static host
    U->>V: Open #/api
    V->>S: GET api.md
    S-->>V: 200 Markdown
    V->>V: Parse, sanitize, mount
    V-->>U: docs-navigate { id, url }
```

## Class diagram

```mermaid
classDiagram
    class NimblyDocsElement {
      +navigate(id, anchor?)
      +setTheme(name)
      +setVersion(id)
      +openSearch()
      +reload()
    }
    class ThemeManager {
      +setTheme()
      +setAppearance()
    }
    class Loader {
      +fetchFirst(candidates)
    }
    NimblyDocsElement --> ThemeManager
    NimblyDocsElement --> Loader
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

## More diagram types :badge[trial]

Pele also handles the types below. Support for them is newer and less tested, so check the output before you rely on them, and report anything that renders wrong.

### Entity relationship

```mermaid
erDiagram
    MANIFEST ||--o{ SECTION : contains
    SECTION ||--o{ PAGE : contains
    PAGE ||--o{ HEADING : has
    MANIFEST {
      string title
      string home
    }
    PAGE {
      string id
      string source
    }
```

### Pie chart

```mermaid
pie title Bundle composition
    "Markdown parser" : 32
    "Sanitizer" : 18
    "Search" : 15
    "UI shell + icons" : 20
    "Themes + highlighter" : 15
```

### Gantt

```mermaid
gantt
    title Release plan
    dateFormat  YYYY-MM-DD
    section Build
    Engine swap        :done,    s1, 2026-10-26, 1d
    Theme variables    :active,  s2, 2026-10-27, 1d
    section Review
    Compatibility check :        r1, after s2, 2d
    Release            :milestone, after r1, 0d
```

## Invalid syntax

This block is broken on purpose. It stays visible as code instead of blanking the page:

```mermaid
flowchart TD
    A -->
    this is not valid --> ???
```
