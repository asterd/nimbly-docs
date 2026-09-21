import { bookIcon, menuIcon, paletteIcon } from "./icons.js";
import { DEFAULT_BRAND_TITLE } from "./constants.js";

/** Brand identity resolved from attributes, then the manifest, then defaults. */
export interface BrandConfig {
  title: string;
  logo?: string;
}

export interface ShellConfig {
  brand: BrandConfig;
  search: boolean;
  /** Label displayed in the search trigger, e.g. ⌘ K or Ctrl K. */
  shortcut: string;
  /** Show the palette switcher (only meaningful with more than one palette). */
  palette: boolean;
}

export interface ShellRefs {
  app: HTMLElement;
  brand: HTMLAnchorElement;
  brandLabel: HTMLElement;
  brandMark: HTMLElement;
  menuButton: HTMLButtonElement;
  appearanceButton: HTMLButtonElement;
  paletteButton: HTMLButtonElement;
  search: HTMLElement;
  searchButton: HTMLButtonElement;
  sidebar: HTMLElement;
  main: HTMLElement;
  breadcrumbs: HTMLElement;
  content: HTMLElement;
  pagination: HTMLElement;
  footer: HTMLElement;
  toc: HTMLElement;
  scrim: HTMLElement;
  live: HTMLElement;
}

/**
 * Build the semantic application shell.
 *
 * Only static, authored markup is assigned as HTML; every value that originates
 * from a manifest or an attribute is set through `textContent`/`setAttribute`
 * so untrusted strings can never become markup.
 */
export function createShell(config: ShellConfig): ShellRefs {
  const app = document.createElement("div");
  app.className = "nd-app";
  app.innerHTML = `
    <a class="nd-skip" href="#nd-main">Skip to content</a>
    <header class="nd-header" part="header">
      <div class="nd-header-start">
        <button class="nd-icon-button nd-mobile-menu" type="button" aria-label="Open navigation" aria-expanded="false">${menuIcon()}</button>
        <a class="nd-brand" part="brand">
          <span class="nd-brand-mark" aria-hidden="true">${bookIcon()}</span>
          <span class="nd-brand-label"></span>
        </a>
      </div>
      <div class="nd-search">
        <button class="nd-search-trigger" type="button" aria-haspopup="dialog">
          <span class="nd-search-trigger-label">Search documentation</span>
          <span class="nd-search-shortcut" aria-hidden="true">${escapeHtml(config.shortcut)}</span>
        </button>
      </div>
      <div class="nd-actions">
        <button class="nd-icon-button nd-palette-button" type="button" aria-label="Change colour palette">${paletteIcon()}</button>
        <button class="nd-icon-button nd-appearance-button" type="button" aria-label="Change appearance"></button>
      </div>
    </header>
    <div class="nd-scrim" hidden></div>
    <div class="nd-layout">
      <nav class="nd-sidebar" part="sidebar" aria-label="Documentation navigation"></nav>
      <main id="nd-main" class="nd-main" part="main" tabindex="-1">
        <nav class="nd-breadcrumbs" aria-label="Breadcrumb" hidden></nav>
        <article class="nd-content" part="content"></article>
        <nav class="nd-pagination" aria-label="Page navigation" hidden></nav>
        <footer class="nd-footer" hidden></footer>
      </main>
      <aside class="nd-toc" part="toc" aria-label="On this page" hidden></aside>
    </div>
    <div class="nd-status" role="status" aria-live="polite" aria-atomic="true"></div>
  `;

  const pick = <T extends HTMLElement>(selector: string): T => {
    const el = app.querySelector<T>(selector);
    if (!el) throw new Error(`Nimbly Docs shell is missing ${selector}`);
    return el;
  };

  const refs: ShellRefs = {
    app,
    brand: pick(".nd-brand"),
    brandLabel: pick(".nd-brand-label"),
    brandMark: pick(".nd-brand-mark"),
    menuButton: pick(".nd-mobile-menu"),
    appearanceButton: pick(".nd-appearance-button"),
    paletteButton: pick(".nd-palette-button"),
    search: pick(".nd-search"),
    searchButton: pick(".nd-search-trigger"),
    sidebar: pick(".nd-sidebar"),
    main: pick(".nd-main"),
    breadcrumbs: pick(".nd-breadcrumbs"),
    content: pick(".nd-content"),
    pagination: pick(".nd-pagination"),
    footer: pick(".nd-footer"),
    toc: pick(".nd-toc"),
    scrim: pick(".nd-scrim"),
    live: pick(".nd-status"),
  };

  applyBrand(refs, config.brand);
  refs.search.hidden = !config.search;
  refs.paletteButton.hidden = !config.palette;
  return refs;
}

/** Apply (or re-apply) the brand name and optional logo, falling back to Nimbly Docs. */
export function applyBrand(refs: ShellRefs, brand: BrandConfig): void {
  const title = brand.title.trim() || DEFAULT_BRAND_TITLE;
  refs.brandLabel.textContent = title;
  refs.brand.setAttribute("aria-label", `${title} — documentation home`);
  refs.brand.title = title;

  if (brand.logo) {
    // Replace the built-in glyph with the configured image, keeping the fallback
    // available if the image cannot be loaded.
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.src = brand.logo;
    img.addEventListener("error", () => { refs.brandMark.innerHTML = bookIcon(); }, { once: true });
    refs.brandMark.replaceChildren(img);
  } else {
    refs.brandMark.innerHTML = bookIcon();
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
