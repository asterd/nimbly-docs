# Pele engine test

This page is a **trial harness** for rendering Mermaid-syntax diagrams with
[Pele](https://github.com/obsidianmd/pele) instead of Mermaid.js. Open it with
`mermaid="on"` and toggle light/dark and each theme in the header: the diagrams
should recolour instantly (Pele reads CSS variables, so there is no re-render).

Each section below is a different diagram type. If any block stays as a plain
code block, Pele could not parse that type — note which one and the version.

## Flowchart

```mermaid
flowchart TD
    A[Browser loads bundle] --> B{Manifest valid?}
    B -- Yes --> C[Fetch page Markdown]
    B -- No --> D[Show error state]
    C --> E[Parse and sanitize]
    E --> F[Mount atomically]
    F --> G{Contains mermaid?}
    G -- Yes --> H[Lazy-load Pele and render SVG]
    G -- No --> I[Done]
    H --> I
```

## Flowchart (left-to-right, styled)

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
    participant V as Viewer
    participant C as CDN
    U->>V: Navigate to page
    V->>C: Fetch Markdown (if uncached)
    C-->>V: 200 + body
    V->>V: Parse, sanitize, mount
    V-->>U: Rendered page
```

## Class diagram

```mermaid
classDiagram
    class NimblyDocsElement {
      +connectedCallback()
      +attributeChangedCallback()
      -renderDiagrams()
    }
    class Loader {
      +fetchFirst(candidates)
    }
    class ThemeManager {
      +get() ThemeState
    }
    NimblyDocsElement --> Loader
    NimblyDocsElement --> ThemeManager
```

## State diagram

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Ready: fetch ok
    Loading --> Error: fetch failed
    Ready --> Loading: navigate
    Error --> Loading: retry
    Ready --> [*]
```

## Entity relationship

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

## Pie chart (series colours)

```mermaid
pie title Bundle composition
    "Markdown parser" : 32
    "Sanitizer" : 18
    "Search" : 15
    "UI shell + icons" : 20
    "Themes + highlighter" : 15
```

## Gantt

```mermaid
gantt
    title Trial plan
    dateFormat  YYYY-MM-DD
    section Spike
    Swap engine        :done,    s1, 2026-10-26, 1d
    Map CSS variables  :active,  s2, 2026-10-27, 1d
    section Review
    Compat check       :         r1, after s2, 2d
    Decision           :milestone, after r1, 0d
```

## Invalid block (should stay a code block)

The following is deliberately broken syntax. It must **not** blank out the page;
it should remain visible as an escaped code block.

```mermaid
flowchart TD
    A -->
    this is not valid --> ???
```
