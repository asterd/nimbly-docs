# Documentation that stays close to your app

**Nimbly Docs** is an embeddable Web Component for local Markdown documentation. It delivers the familiar Docsify experience—nested navigation, search, themes, page TOC and deep links—without a framework, a remote plugin system, or runtime dependencies.

> This site uses **Nimbly Classic**, the new default theme, designed for long-form reading on any device. Try the others from the palette button in the header, and switch to the previous release's docs from the version selector next to the logo.

## Why this exists

Documentation is often shipped with an application, but modern documentation stacks can make a small local manual depend on a large framework or a third-party network request. Nimbly Docs keeps the operational model deliberately simple:

1. Ship one cacheable ESM file.
2. Keep `index.json` and Markdown next to the application.
3. Serve it from the same origin.
4. Navigate with hashes—no server rewrite required.

## What you get

| Capability | Included | Notes |
| --- | :---: | --- |
| Nested sidebar | ✓ | Manifest driven and keyboard accessible |
| Hash routing | ✓ | Deep links, refresh, browser history |
| Local search | ✓ | Built progressively while pages are read |
| Markdown | ✓ | Raw HTML is disabled and output is sanitized |
| Themes | ✓ | Eight built-ins (`nimbly` by default, plus Material-, Starlight- and Docusaurus-inspired skins) and validated custom tokens |
| Interactive components | ✓ | Callouts, tabs, code groups with a synced language switch, steps, cards, using Markdown directives instead of MDX |
| Versioned docs | ✓ | Version selector, legacy/unreleased banners, `#/@version/page` deep links |
| Code blocks | ✓ | Compact highlighting and copy controls |
| Remote plugins | ✗ | Intentionally never loaded from a manifest |

## Try it

Use the sidebar, press `⌘K` (or `Ctrl K`) for search, and use the appearance button in the top right to switch between light, dark and auto. Then visit [installation](./installation.md) or inspect the [security model](./security.md).

## A safe by-default document

Raw HTML such as `<script>alert('no')</script>` is rendered as text—not executed. Links and image URLs are validated again after parsing, and no Markdown code block is ever evaluated.
