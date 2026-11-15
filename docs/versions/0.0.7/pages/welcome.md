# Nimbly Docs

Nimbly Docs is a Web Component that renders Markdown documentation from a JSON manifest. You get a sidebar, search, themes, a table of contents and deep links, similar to Docsify, but with no framework, no plugin downloads and no runtime dependencies.

This site runs on Nimbly Docs and uses the default theme, Nimbly Classic. You can try the other themes from the palette button in the header, and open the docs of the previous release from the version selector next to the logo.

## How it works

You ship three things with your application:

1. the viewer, a single ESM file;
2. an `index.json` manifest that describes the navigation;
3. your Markdown pages.

Serve them from the same origin and add `<nimbly-docs manifest="./index.json">` to a page. Navigation uses URL hashes, so no server rewrite rules are needed.

## Features

| Feature | Supported | Notes |
| --- | :---: | --- |
| Nested sidebar | ✓ | Built from the manifest, keyboard accessible |
| Hash routing | ✓ | Deep links, refresh and browser history work |
| Local search | ✓ | The index is built in the browser as pages load |
| Markdown | ✓ | Raw HTML is escaped and the output is sanitized |
| Themes | ✓ | Eight built-in themes plus custom token sets |
| Interactive components | ✓ | Callouts, tabs, code groups, steps, cards and badges, written as Markdown directives |
| Versioned docs | ✓ | Version selector, banners for old releases, `#/@version/page` links |
| Code blocks | ✓ | Syntax highlighting and a copy button |
| Remote plugins | ✗ | A manifest can never load code |

## Getting around

Use the sidebar, or press `⌘K` (`Ctrl K` on Windows and Linux) to search. The button in the top right switches between light, dark and automatic appearance. Next, read [Installation](./installation.md) or the [Security model](./security.md).

## Raw HTML is shown as text

Markdown such as `<script>alert('no')</script>` is displayed, not executed. Link and image URLs are checked again after parsing, and code blocks are never evaluated.
