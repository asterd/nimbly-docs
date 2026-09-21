# Themes

Themes are CSS token sets, not arbitrary stylesheet injection. This keeps branding flexible without making a manifest executable.

## Included themes

| Name | Character | Mode |
| --- | --- | --- |
| `nimbus` | Clean neutral blue | Light |
| `midnight` | Deep navy | Dark |
| `paper` | High-contrast editorial | Light |
| `sabbia` | Warm, earthy and calm | Light |
| `auto` | Follows `prefers-color-scheme` | Adaptive |

The default demo theme is `sabbia`, inspired by Shootly’s warm values: off-white paper (`#f8f7f4`), weathered taupe (`#7d6d4f`) and dark brown (`#5e5138`).

## Use a built-in theme

```html
<nimbly-docs manifest="./index.json" theme="midnight"></nimbly-docs>
```

The selected theme is remembered locally under a namespaced key when storage is available. No cookie and no telemetry are used.

## Add a custom theme

A manifest can define tokens from a strict allow-list. Values that resemble URLs, expressions, CSS blocks, or JavaScript are discarded.

```json
{
  "themes": [{
    "name": "brand",
    "base": "nimbus",
    "light": {
      "color-bg": "#f5fbff",
      "color-text": "#102a43",
      "color-brand": "#0077b6",
      "color-brand-strong": "#005f92",
      "content-max-width": "78ch"
    }
  }]
}
```

Then use `theme="brand"` on the element or call `viewer.setTheme("brand")`. Host pages can also set public custom properties such as `--dv-color-brand` and `--dv-font-body` on `nimbly-docs`.
