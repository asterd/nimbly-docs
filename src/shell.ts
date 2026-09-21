import { apiIcon, bookIcon, chevronIcon, externalIcon, githubIcon, globeIcon, linkedinIcon, menuIcon } from "./icons.js";
import { DEFAULT_BRAND_TITLE } from "./constants.js";
import type { ManifestApiReference, ManifestLanguage, ManifestLink } from "./types.js";
import type { UIStrings } from "./i18n.js";

/** Brand identity resolved from attributes, then the manifest, then defaults. */
export interface BrandConfig {
  title: string;
  logo?: string;
}

export interface ShellConfig {
  brand: BrandConfig;
  search: boolean;
  /** Label displayed in the search trigger, e.g. ⌘K or Ctrl K. */
  shortcut: string;
  /** Validated header social/external links. */
  links: ManifestLink[];
  /** Available languages (empty when single-language). */
  languages: ManifestLanguage[];
  /** Active language code. */
  activeLanguage: string;
  /** Pinned API reference for the sidebar footer, if any. */
  apiReference?: ManifestApiReference;
  /** Localized UI strings. */
  strings: UIStrings;
}

export interface ShellRefs {
  app: HTMLElement;
  brand: HTMLAnchorElement;
  brandLabel: HTMLElement;
  brandMark: HTMLElement;
  menuButton: HTMLButtonElement;
  appearanceButton: HTMLButtonElement;
  languageButton: HTMLButtonElement | null;
  search: HTMLElement;
  searchButton: HTMLButtonElement;
  sidebar: HTMLElement;
  sidebarNav: HTMLElement;
  main: HTMLElement;
  breadcrumbs: HTMLElement;
  content: HTMLElement;
  pagination: HTMLElement;
  footer: HTMLElement;
  toc: HTMLElement;
  scrim: HTMLElement;
  live: HTMLElement;
}

const LINK_ICON: Record<string, () => string> = {
  github: githubIcon,
  linkedin: linkedinIcon,
  external: externalIcon,
};
const LINK_LABEL: Record<string, string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  external: "Website",
};

/**
 * Build the semantic application shell. Only static, authored markup is assigned
 * as HTML; every manifest/attribute value is set via textContent/setAttribute so
 * untrusted strings can never become markup.
 */
export function createShell(config: ShellConfig): ShellRefs {
  const app = document.createElement("div");
  app.className = "nd-app";
  app.innerHTML = `
    <a class="nd-skip" href="#nd-main"></a>
    <header class="nd-header" part="header">
      <div class="nd-header-start">
        <button class="nd-icon-button nd-mobile-menu" type="button" aria-expanded="false">${menuIcon()}</button>
        <a class="nd-brand" part="brand">
          <span class="nd-brand-mark" aria-hidden="true">${bookIcon()}</span>
          <span class="nd-brand-label"></span>
        </a>
      </div>
      <div class="nd-search">
        <button class="nd-search-trigger" type="button" aria-haspopup="dialog">
          <span class="nd-search-trigger-label"></span>
          <span class="nd-search-shortcut" aria-hidden="true"></span>
        </button>
      </div>
      <div class="nd-actions">
        <div class="nd-links" part="links"></div>
        <div class="nd-lang"></div>
        <button class="nd-icon-button nd-appearance-button" type="button"></button>
      </div>
    </header>
    <div class="nd-scrim" hidden></div>
    <div class="nd-layout">
      <nav class="nd-sidebar" part="sidebar" aria-label="">
        <div class="nd-sidebar-nav"></div>
        <div class="nd-sidebar-footer" hidden></div>
      </nav>
      <main id="nd-main" class="nd-main" part="main" tabindex="-1">
        <nav class="nd-breadcrumbs" aria-label="Breadcrumb" hidden></nav>
        <article class="nd-content" part="content"></article>
        <nav class="nd-pagination" aria-label="Page navigation" hidden></nav>
        <footer class="nd-footer" hidden></footer>
        <div class="nd-powered" part="powered"></div>
      </main>
      <aside class="nd-toc" part="toc" aria-label="" hidden></aside>
    </div>
    <div class="nd-status" role="status" aria-live="polite" aria-atomic="true"></div>
  `;

  const pick = <T extends HTMLElement>(selector: string): T => {
    const el = app.querySelector<T>(selector);
    if (!el) throw new Error(`Nimbly Docs shell is missing ${selector}`);
    return el;
  };

  const s = config.strings;
  pick(".nd-skip").textContent = s.skipToContent;
  pick(".nd-mobile-menu").setAttribute("aria-label", s.openNav);
  pick<HTMLElement>(".nd-search-trigger-label").textContent = s.searchPlaceholder;
  pick(".nd-sidebar").setAttribute("aria-label", s.documentation);
  pick(".nd-toc").setAttribute("aria-label", s.onThisPage);

  const refs: ShellRefs = {
    app,
    brand: pick(".nd-brand"),
    brandLabel: pick(".nd-brand-label"),
    brandMark: pick(".nd-brand-mark"),
    menuButton: pick(".nd-mobile-menu"),
    appearanceButton: pick(".nd-appearance-button"),
    languageButton: null,
    search: pick(".nd-search"),
    searchButton: pick(".nd-search-trigger"),
    sidebar: pick(".nd-sidebar"),
    sidebarNav: pick(".nd-sidebar-nav"),
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
  refs.searchButton.querySelector<HTMLElement>(".nd-search-shortcut")!.textContent = config.shortcut;
  refs.search.hidden = !config.search;

  renderLinks(pick(".nd-links"), config.links);
  renderApiReference(pick(".nd-sidebar-footer"), config.apiReference, s.apiReference);
  renderPoweredBy(pick(".nd-powered"), s.poweredBy);

  return refs;
}

/** Populate the header social/external links (icons only). */
function renderLinks(container: HTMLElement, links: ManifestLink[]): void {
  container.replaceChildren();
  container.hidden = links.length === 0;
  for (const link of links) {
    const a = document.createElement("a");
    a.className = "nd-icon-button nd-link";
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const label = link.label || LINK_LABEL[link.type] || "External link";
    a.setAttribute("aria-label", label);
    a.title = label;
    a.innerHTML = (LINK_ICON[link.type] || externalIcon)();
    container.appendChild(a);
  }
}

/** Render the pinned API reference link at the bottom of the sidebar. */
function renderApiReference(
  footer: HTMLElement,
  apiReference: ManifestApiReference | undefined,
  fallbackLabel: string
): void {
  footer.replaceChildren();
  if (!apiReference) {
    footer.hidden = true;
    return;
  }
  const a = document.createElement("a");
  a.className = "nd-api-link";
  a.href = apiReference.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  const icon = document.createElement("span");
  icon.className = "nd-api-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = apiIcon();
  const label = document.createElement("span");
  label.textContent = apiReference.label || fallbackLabel;
  const ext = document.createElement("span");
  ext.className = "nd-api-ext";
  ext.setAttribute("aria-hidden", "true");
  ext.innerHTML = externalIcon();
  a.append(icon, label, ext);
  footer.appendChild(a);
  footer.hidden = false;
}

/** Render the non-removable, discreet "Powered by Nimbly Docs" footer. */
function renderPoweredBy(container: HTMLElement, poweredByLabel: string): void {
  container.replaceChildren();
  const link = document.createElement("a");
  link.className = "nd-powered-link";
  link.href = "https://github.com/asterd/nimbly-docs";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const mark = document.createElement("span");
  mark.className = "nd-powered-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.innerHTML = bookIcon();
  const text = document.createElement("span");
  text.textContent = `${poweredByLabel} Nimbly Docs`;
  link.append(mark, text);
  container.appendChild(link);
}

/**
 * Build (or rebuild) the header language selector. Returns the select element,
 * or null when the docs are single-language.
 */
export function renderLanguageSelector(
  refs: ShellRefs,
  languages: ManifestLanguage[],
  active: string,
  label: string
): HTMLButtonElement | null {
  const host = refs.app.querySelector<HTMLElement>(".nd-lang");
  if (!host) return null;
  host.replaceChildren();
  if (languages.length < 2) {
    host.hidden = true;
    refs.languageButton = null;
    return null;
  }
  const button = document.createElement("button");
  button.type = "button";
  // Not an .nd-icon-button: that class forces a fixed 2.25rem grid cell which
  // would stack the globe and the code onto two lines.
  button.className = "nd-lang-button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.setAttribute("aria-haspopup", "listbox");
  button.innerHTML = `<span class="nd-lang-glyph" aria-hidden="true">${globeIcon()}</span><span class="nd-lang-code"></span><span class="nd-lang-caret" aria-hidden="true">${chevronIcon()}</span>`;
  const code = button.querySelector<HTMLElement>(".nd-lang-code")!;
  const activeLang = languages.find((l) => l.code === active) ?? languages[0]!;
  code.textContent = activeLang.code.toUpperCase();
  host.appendChild(button);
  host.hidden = false;
  refs.languageButton = button;
  return button;
}

/** A small popover listing the available languages. */
export function renderLanguageMenu(
  refs: ShellRefs,
  languages: ManifestLanguage[],
  active: string,
  onSelect: (code: string) => void
): void {
  const host = refs.app.querySelector<HTMLElement>(".nd-lang");
  if (!host) return;
  host.querySelector(".nd-lang-menu")?.remove();
  const menu = document.createElement("div");
  menu.className = "nd-lang-menu";
  menu.setAttribute("role", "listbox");
  for (const lang of languages) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "nd-lang-option";
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(lang.code === active));
    option.textContent = lang.label;
    option.addEventListener("click", () => {
      menu.remove();
      onSelect(lang.code);
    });
    menu.appendChild(option);
  }
  host.appendChild(menu);
  // Dismiss on outside click.
  const dismiss = (event: Event): void => {
    if (!menu.contains(event.target as Node) && event.target !== refs.languageButton) {
      menu.remove();
      refs.app.removeEventListener("click", dismiss, true);
    }
  };
  setTimeout(() => refs.app.addEventListener("click", dismiss, true), 0);
}

/** Apply (or re-apply) the brand name and optional logo, falling back to Nimbly Docs. */
export function applyBrand(refs: ShellRefs, brand: BrandConfig): void {
  const title = brand.title.trim() || DEFAULT_BRAND_TITLE;
  refs.brandLabel.textContent = title;
  refs.brand.setAttribute("aria-label", `${title} — documentation home`);
  refs.brand.title = title;

  if (brand.logo) {
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
