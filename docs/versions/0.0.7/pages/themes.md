# Themes

A theme is a set of CSS custom properties (tokens). The manifest can set token values but can't inject CSS, so a theme never becomes a way to load code.

Each theme defines:

- a **palette**: colours for a light and a dark scheme. Light, dark and auto are chosen separately, so every theme supports both;
- a **skin**: type size, line height, heading weight, header and sidebar colours, and how the current page is highlighted in the sidebar. This is what makes `material` or `stellar` look different beyond their colours.

## Built-in themes

| Name | Character | Inspired by |
| --- | --- | --- |
| `nimbly` | **Nimbly Classic**, the default: teal and amber, tuned for long-form reading | Original |
| `nimbus` | Clean neutral blue | Original |
| `midnight` | Deep navy | Original |
| `paper` | High-contrast editorial | Original |
| `sabbia` | Warm, earthy and calm | Shootly |
| `material` | Coloured app bar, Roboto, light headings | Material for MkDocs |
| `stellar` | Dark-first, vivid violet accent, filled active nav item | Starlight (Astro) |
| `evergreen` | White navbar, green brand, quiet chrome | Docusaurus classic |

`material`, `stellar` and `evergreen` imitate the look of those projects using Nimbly tokens. No code, fonts or brand assets are copied, and no web fonts are downloaded. Each theme lists the original font first in a system font stack, so readers who already have it installed (Roboto on Android, for example) will see it.

:::tip
This site has `chooseThemes` enabled. Use the palette button in the header to try each theme.
:::

## Nimbly Classic

Nimbly Classic is the default theme. It aims to be easy to recognise and comfortable to read on phones and desktops alike. The values follow common readability guidelines:

| Choice | Value | Why |
| --- | --- | --- |
| Body size | `16px` | Body text should be at least 16px on screens; smaller text forces zooming on phones. |
| Line height | `1.7` | Long-form text needs at least 1.5; a little more helps dense technical prose. |
| Line length | `72ch` | Close to the classic 45–75 characters per line (about 66 is ideal). |
| Text colour | `#16201f` on `#f8faf9` | About 15.9:1 contrast without pure black on pure white, which glares on bright screens. |
| Dark scheme | `#e3ece9` on `#0c1312` | About 15.6:1, again avoiding pure white on pure black. |
| Secondary text | `#4f5d5b` / `#9db1ad` | 6.6:1 and 8.4:1, comfortably above WCAG AA (4.5:1). |
| Links | `#085c55` / `#7ee6d6` | 7.5:1 and 12.7:1. Links are also underlined, so colour is never the only cue. |
| Brand | Teal `#0b7a70` with an amber accent `#c2410c` | A distinctive pair among docs themes. Amber also marks focus rings, so keyboard focus is always visible. |
| Fonts | Native stack: SF / Segoe UI Variable / Roboto, then Inter | Nothing to download, so text appears instantly and uses each platform's best-hinted face. |
| Code | `ui-monospace`, SF Mono, Cascadia Code, JetBrains Mono… | The best monospace font already installed on each OS. |

Its visual signature is small: a thin teal-to-amber line at the top of the header and under each page title, and a teal edge on the current page in the sidebar. Section headings have no underline and inline code has no border, which keeps long pages quiet.

Contrast values are WCAG 2 ratios against the page background.

## Use a theme

```html
<nimbly-docs manifest="./index.json" theme="material"></nimbly-docs>
```

You can also set the default in the manifest with `"theme": "stellar"`. The `theme` attribute takes precedence over the reader's saved choice, and the saved choice over the manifest. The choice is stored in local storage; no cookies are used.

To let readers pick a theme, enable the menu:

```json
{ "chooseThemes": ["nimbly", "material", "stellar", "evergreen"] }
```

## Add a custom theme

The manifest can define themes using the tokens listed below. Values that look like URLs, CSS expressions, CSS blocks or JavaScript are dropped. A custom theme starts from the palette and skin of its `base` theme (`nimbly` if omitted):

```json
{
  "themes": [{
    "name": "brand",
    "base": "evergreen",
    "light": {
      "color-brand": "#0077b6",
      "color-brand-strong": "#005f92",
      "header-bg": "#0b2545",
      "header-text": "#ffffff",
      "header-muted": "#c9d6ea",
      "content-max-width": "78ch"
    }
  }]
}
```

### Token reference

| Group | Tokens |
| --- | --- |
| Palette | `color-bg`, `color-surface`, `color-surface-raised`, `color-text`, `color-muted`, `color-brand`, `color-brand-strong`, `color-accent`, `color-border`, `color-code-bg`, `color-code-text`, `color-focus` |
| Callouts | `color-note`, `color-tip`, `color-warning`, `color-danger` |
| Type | `font-body`, `font-mono`, `font-size`, `line-height`, `heading-weight` |
| Layout | `content-max-width`, `radius`, `shadow` |
| Chrome | `header-bg`, `header-text`, `header-muted`, `header-border`, `sidebar-bg`, `nav-active-bg`, `nav-active-text` |

A host page can also set these tokens directly on the `nimbly-docs` element as CSS custom properties with a `--dv-` prefix, for example `--dv-color-brand` or `--dv-font-body`.
