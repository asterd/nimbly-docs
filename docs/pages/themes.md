# Themes

A theme is a set of CSS tokens, never arbitrary injected CSS. Branding stays flexible and a manifest can never become executable.

A theme works on two levels:

- **Palette.** Colours for both a light and a dark scheme. The light/dark/auto appearance is a separate control, so every theme works in both.
- **Skin.** Structural tokens such as type size, line height, heading weight, header and sidebar colours, and the style of the active navigation item. Skins let a theme change its feel, not just its colours.

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

`material`, `stellar` and `evergreen` recreate the look of those projects with Nimbly tokens. They copy no code, fonts or brand assets, and they load no external fonts: each uses a system font stack, starting with the original font where the reader already has it installed (for example Roboto on Android).

:::tip
This site enables `chooseThemes`, so you can try every theme live from the palette button in the header.
:::

## Nimbly Classic

Nimbly Classic is the default theme. It is built to be **recognisable at a glance and comfortable to read on any device**. Each choice follows common readability guidance:

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

What makes it recognisable:

- a thin teal-to-amber bar along the top of the header, repeated under each page title;
- a solid teal edge on the active sidebar page;
- callouts, tabs and code groups that reuse the same accent.

All ratios are WCAG 2 contrast ratios measured against the page background.

## Use a theme

```html
<nimbly-docs manifest="./index.json" theme="material"></nimbly-docs>
```

Or set a default in the manifest with `"theme": "stellar"`. An explicit attribute wins over the reader's saved choice, which wins over the manifest. The selected theme is saved locally under a namespaced key when storage is available. No cookie and no telemetry are used.

To let readers choose, enable the selector:

```json
{ "chooseThemes": ["nimbly", "material", "stellar", "evergreen"] }
```

## Add a custom theme

A manifest can set tokens from a strict allow-list. Values that look like URLs, expressions, CSS blocks or JavaScript are discarded. A custom theme inherits the palette **and skin** of its `base` (`nimbly` by default):

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

Host pages can set the same tokens as CSS custom properties prefixed with `--dv-`, such as `--dv-color-brand` and `--dv-font-body`, on the `nimbly-docs` element.
