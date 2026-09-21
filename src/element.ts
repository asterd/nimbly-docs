import styles from "./styles.css";
import { DEFAULT_BRAND_TITLE, DEFAULT_MERMAID_SRC, DEFAULT_TIMEOUT, LIMITS, VERSION } from "./constants.js";
import { announce, focusMain } from "./a11y.js";
import { autoIcon, moonIcon, sunIcon } from "./icons.js";
import { hasMermaid, renderMermaid } from "./mermaid.js";
import { Loader, LoaderError } from "./loader.js";
import { ManifestError, normalizeManifest } from "./manifest.js";
import { handleCopyClick, renderContent } from "./render.js";
import { Router, type Route } from "./router.js";
import { SearchController } from "./search.js";
import { applyBrand, createShell, renderLanguageMenu, renderLanguageSelector, type BrandConfig, type ShellRefs } from "./shell.js";
import { Sidebar } from "./sidebar.js";
import { ThemeManager, type Appearance, type ThemeState } from "./theme.js";
import { Toc } from "./toc.js";
import { persistedLocale, persistLocale, stringsFor, type UIStrings } from "./i18n.js";
import type { DocsError, NimblyPlugin, ResolvedManifest, ResolvedPage, ViewerOptions } from "./types.js";

const DEFAULTS: ViewerOptions = {
  manifest: "./index.json", theme: "auto", locale: "", router: "hash", search: true,
  toc: "auto", sidebar: "auto", debug: false, timeout: DEFAULT_TIMEOUT, maxPageBytes: LIMITS.maxPageBytes,
  mermaid: false, mermaidSrc: DEFAULT_MERMAID_SRC,
};

const APPEARANCE_LABEL: Record<Appearance, string> = {
  light: "Light appearance — activate for dark",
  dark: "Dark appearance — activate for system default",
  auto: "System appearance — activate for light",
};

/** The secure, embeddable Nimbly Docs custom element. */
export class NimblyDocsElement extends HTMLElement {
  static readonly version = VERSION;
  static readonly plugins: NimblyPlugin[] = [];
  static get observedAttributes(): string[] {
    return ["manifest", "theme", "appearance", "locale", "title", "logo", "search", "toc", "sidebar", "debug", "mermaid", "mermaid-src"];
  }

  /** Register a local, application-owned plugin. Remote manifest plugins are intentionally unsupported. */
  static use(plugin: NimblyPlugin): void {
    if (!plugin?.name || this.plugins.some((p) => p.name === plugin.name)) return;
    this.plugins.push(plugin);
  }

  private readonly root = this.attachShadow({ mode: "open" });
  private readonly router = new Router();
  private loader: Loader | null = null;
  private manifest: ResolvedManifest | null = null;
  private shell: ShellRefs | null = null;
  private sidebarView: Sidebar | null = null;
  private tocView: Toc | null = null;
  private searchView: SearchController | null = null;
  private themes: ThemeManager | null = null;
  private initialized = false;
  private navigating = 0;
  private locale = "";
  private strings: UIStrings = stringsFor("en");

  connectedCallback(): void {
    this.syncPageMode();
    void this.initialize();
  }
  disconnectedCallback(): void {
    this.removeAttribute("data-page");
    this.router.stop();
    this.loader?.abortPending();
    this.tocView?.disconnect();
    this.themes?.destroy();
    this.searchView?.destroy();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (!this.initialized || oldValue === newValue) return;
    if (name === "theme") this.setTheme(newValue || "nimbus");
    else if (name === "appearance") this.setAppearance(newValue || "auto");
    else if (name === "title" || name === "logo") this.refreshBrand();
    else if (name === "manifest") void this.reload();
  }

  /** Navigate to a known page id, optionally to its heading id. */
  navigate(id: string, anchor?: string): void { this.router.go(id, anchor); }

  /** Re-fetch and validate the manifest, retaining the UI shell only when successful. */
  async reload(): Promise<void> {
    this.router.stop();
    this.loader?.abortPending();
    this.searchView?.destroy();
    this.searchView = null;
    this.manifest = null;
    await this.initialize(true);
  }

  /** Select a colour palette. Returns the applied palette name. */
  setTheme(name: string): string {
    const state = this.themes?.setTheme(name);
    return state?.theme ?? "nimbus";
  }

  /** Select light, dark or auto appearance. Returns the applied appearance. */
  setAppearance(value: string): Appearance {
    const state = this.themes?.setAppearance(value);
    return state?.appearance ?? "auto";
  }

  /** Open the full client-side search dialog. */
  openSearch(): void { this.searchView?.open(); }

  /** Cycle to the next available colour palette (built-ins then manifest themes). */
  cyclePalette(): string {
    if (!this.themes) return "nimbus";
    const all = this.themes.themes();
    const at = all.indexOf(this.themes.get().theme);
    const next = all[(at + 1) % all.length]!;
    const applied = this.setTheme(next);
    if (this.shell) announce(this.shell.live, `Palette: ${applied}`);
    return applied;
  }

  /** Switch the active content/UI language and re-render the current page. */
  setLocale(code: string): void {
    if (!this.manifest) return;
    const available = this.manifest.languages.map((l) => l.code);
    const next = available.includes(code) ? code : this.manifest.defaultLanguage;
    if (next === this.locale) return;
    this.locale = next;
    persistLocale(next);
    this.strings = stringsFor(next);
    document.documentElement.setAttribute("lang", next);
    // Rebuild the shell so all localized labels update, then re-render the route.
    this.mountShell(this.options());
    this.router.start((route) => void this.onRoute(route));
  }

  /** Resolve the initial locale from attribute, storage, then manifest default. */
  private resolveLocale(opts: ViewerOptions): string {
    if (!this.manifest || this.manifest.languages.length === 0) return this.manifest?.language ?? "en";
    const codes = this.manifest.languages.map((l) => l.code);
    const attr = opts.locale.toLowerCase();
    if (attr && codes.includes(attr)) return attr;
    const stored = persistedLocale();
    if (stored && codes.includes(stored)) return stored;
    return this.manifest.defaultLanguage;
  }

  /** The Markdown URL for a page in the active locale, falling back to default. */
  private pageUrl(page: ResolvedPage): string {
    return page.localeUrls[this.locale] ?? page.url;
  }

  /** Mark only a direct-body viewer as page-owned; embedded viewers keep host layout. */
  private syncPageMode(): void {
    this.toggleAttribute("data-page", this.parentElement === document.body);
  }

  /** Visible platform-aware shortcut hint, while the actual key handling stays Cmd/Ctrl+K. */
  private searchShortcut(): string {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const platform = nav.userAgentData?.platform || navigator.platform || navigator.userAgent;
    return /mac|iphone|ipad|ipod/i.test(platform) ? "⌘K" : "Ctrl K";
  }

  private options(): ViewerOptions {
    const bool = (name: string, fallback: boolean): boolean => {
      const v = this.getAttribute(name); return v === null ? fallback : !["false", "off", "0"].includes(v.toLowerCase());
    };
    const choice = <T extends string>(name: string, allowed: readonly T[], fallback: T): T => {
      const v = this.getAttribute(name) as T | null; return v && allowed.includes(v) ? v : fallback;
    };
    return {
      manifest: this.getAttribute("manifest") || DEFAULTS.manifest,
      theme: this.getAttribute("theme") || DEFAULTS.theme,
      locale: this.getAttribute("locale") || DEFAULTS.locale,
      router: "hash", search: bool("search", true), toc: choice("toc", ["auto", "on", "off"] as const, "auto"),
      sidebar: choice("sidebar", ["auto", "open", "closed"] as const, "auto"), debug: bool("debug", false),
      timeout: DEFAULTS.timeout, maxPageBytes: DEFAULTS.maxPageBytes,
      mermaid: this.getAttribute("mermaid") !== null && bool("mermaid", true),
      mermaidSrc: this.getAttribute("mermaid-src") || DEFAULTS.mermaidSrc,
    };
  }

  /** Resolve the brand from attributes, then the manifest, then the built-in default. */
  private brandConfig(): BrandConfig {
    const title = this.getAttribute("title") || this.manifest?.title || DEFAULT_BRAND_TITLE;
    const logo = this.getAttribute("logo") || this.manifest?.logo;
    const config: BrandConfig = { title };
    if (logo) {
      try { config.logo = new URL(logo, document.baseURI).href; } catch { /* ignore invalid logo URL */ }
    }
    return config;
  }

  private async initialize(isReload = false): Promise<void> {
    const opts = this.options();
    const manifestUrl = new URL(opts.manifest, document.baseURI).href;
    this.loader = new Loader({ timeout: opts.timeout, maxPageBytes: opts.maxPageBytes });
    this.renderLoading();
    try {
      const raw = await this.loader.fetchManifest(manifestUrl);
      this.manifest = normalizeManifest(raw, manifestUrl);
      this.initialized = true;
      this.locale = this.resolveLocale(opts);
      this.strings = stringsFor(this.locale);
      if (this.manifest.languages.length > 0) document.documentElement.setAttribute("lang", this.locale);
      this.mountShell(opts);
      for (const plugin of NimblyDocsElement.plugins) {
        plugin.setup?.({ manifest: this.manifest, navigate: (id) => this.navigate(id), setTheme: (name) => this.setTheme(name) });
      }
      this.dispatchEvent(new CustomEvent("docs-ready", { detail: { title: this.manifest.title, version: VERSION }, bubbles: true, composed: true }));
      this.router.start((route) => void this.onRoute(route));
    } catch (err) {
      this.initialized = false;
      const code = err instanceof ManifestError || (err instanceof LoaderError && err.code === "manifest-invalid") ? "manifest-invalid" : "manifest-fetch";
      this.showError({ code, message: "Unable to load the documentation configuration.", cause: err });
      if (!isReload) this.debug(err);
    }
  }

  private mountShell(opts: ViewerOptions): void {
    if (!this.manifest) return;
    // Re-mounting (e.g. on locale switch) must not stack router listeners.
    this.router.stop();
    this.tocView?.disconnect();
    this.searchView?.destroy();
    this.root.replaceChildren();
    const style = document.createElement("style");
    style.textContent = styles;

    const shell = createShell({
      brand: this.brandConfig(),
      search: this.manifest.features.search && opts.search,
      shortcut: this.searchShortcut(),
      links: this.manifest.links,
      languages: this.manifest.languages,
      activeLanguage: this.locale,
      apiReference: this.manifest.apiReference,
      strings: this.strings,
    });
    this.root.append(style, shell.app);
    this.shell = shell;

    this.themes = new ThemeManager(this, this.manifest, (state) => this.onThemeChange(state));
    this.themes.initialize(this.getAttribute("theme"), this.getAttribute("appearance"));

    this.sidebarView = new Sidebar(shell.sidebarNav, this.manifest, () => this.closeDrawer(), this.strings.documentation);
    this.tocView = new Toc(shell.toc, () => this.closeDrawer());
    this.searchView = this.manifest.features.search && opts.search
      ? new SearchController(this.manifest, shell.app, (id) => this.navigate(id))
      : null;

    shell.brand.href = `#/${encodeURI(this.manifest.homeId)}`;
    shell.menuButton.addEventListener("click", () => this.toggleDrawer());
    shell.scrim.addEventListener("click", () => this.closeDrawer());
    shell.appearanceButton.addEventListener("click", () => this.themes?.cycleAppearance());
    shell.searchButton.addEventListener("click", () => this.openSearch());
    shell.app.addEventListener("click", (event) => { void handleCopyClick(event.target); });
    this.root.addEventListener("keydown", (event) => this.onGlobalKeydown(event as KeyboardEvent));

    // Language selector, only when more than one language is declared.
    const langButton = renderLanguageSelector(shell, this.manifest.languages, this.locale, this.strings.language);
    if (langButton) {
      langButton.addEventListener("click", (event) => {
        event.stopPropagation();
        renderLanguageMenu(shell, this.manifest!.languages, this.locale, (code) => this.setLocale(code));
      });
    }

    if (this.manifest.footer) { shell.footer.textContent = this.manifest.footer; shell.footer.hidden = false; }
  }

  private onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && this.searchView) {
      event.preventDefault();
      this.openSearch();
      return;
    }
    // The search dialog stops its own Escape events, so this only closes the drawer.
    if (event.key === "Escape") this.closeDrawer();
  }

  /** Reflect resolved theme state onto the appearance button icon and label. */
  private onThemeChange(state: ThemeState): void {
    const button = this.shell?.appearanceButton;
    if (!button) return;
    const icon = state.appearance === "light" ? sunIcon() : state.appearance === "dark" ? moonIcon() : autoIcon();
    button.innerHTML = icon;
    button.setAttribute("aria-label", APPEARANCE_LABEL[state.appearance]);
    button.setAttribute("title", APPEARANCE_LABEL[state.appearance]);
    button.dataset.appearance = state.appearance;
    // Diagrams bake their palette at render time, so re-render them on scheme change.
    void this.renderDiagrams();
  }

  /** Render any Mermaid diagrams in the current page, honouring the active scheme. */
  private async renderDiagrams(): Promise<void> {
    const opts = this.options();
    const content = this.shell?.content;
    if (!opts.mermaid || !content || !hasMermaid(content)) return;
    await renderMermaid(content, {
      enabled: true,
      src: opts.mermaidSrc,
      dark: this.themes?.get().scheme === "dark",
    });
  }

  private refreshBrand(): void {
    if (this.shell) applyBrand(this.shell, this.brandConfig());
  }

  private async onRoute(route: Route): Promise<void> {
    const manifest = this.manifest, shell = this.shell, loader = this.loader;
    if (!manifest || !shell || !loader) return;
    const pageId = route.pageId || manifest.homeId;
    const page = manifest.pages.get(pageId);
    if (!page) { this.showError({ code: "page-not-found", message: "The requested page does not exist." }); return; }
    const sequence = ++this.navigating;
    this.renderPageLoading();
    try {
      const markdown = await loader.fetchPage(this.pageUrl(page));
      if (sequence !== this.navigating) return;
      const result = renderContent(markdown, { manifest, page, debug: this.options().debug, copyCode: manifest.features.copyCode, plugins: NimblyDocsElement.plugins });
      shell.content.replaceChildren(result.fragment);
      shell.content.removeAttribute("aria-busy");
      void this.renderDiagrams();
      this.sidebarView?.render(page.id);
      const tocEnabled = this.options().toc !== "off" && manifest.features.toc;
      if (tocEnabled) this.tocView?.render(page.id, result.doc.toc); else shell.toc.hidden = true;
      this.renderMeta(page);
      this.searchView?.index(page.id, result.doc.text, result.doc.toc.map((h) => h.text));
      document.title = `${page.title} · ${manifest.title}`;
      announce(shell.live, `Loaded ${page.title}`);
      this.dispatchEvent(new CustomEvent("docs-navigate", { detail: { id: page.id, url: page.url }, bubbles: true, composed: true }));
      this.scrollToAnchor(route.anchor);
      focusMain(shell.main);
    } catch (err) {
      if (sequence !== this.navigating) return;
      if (err instanceof LoaderError && err.code === "network-timeout" && loader) return;
      const e = err as LoaderError;
      const code = e instanceof LoaderError ? e.code : "page-fetch";
      this.showError({ code, message: "Unable to load this documentation page.", cause: err });
      this.debug(err);
    }
  }

  private renderMeta(page: ResolvedPage): void {
    const manifest = this.manifest!, shell = this.shell!;
    if (manifest.features.breadcrumbs) {
      shell.breadcrumbs.replaceChildren();
      for (const item of [...page.sectionPath, page.title]) { const span = document.createElement("span"); span.textContent = item; shell.breadcrumbs.appendChild(span); }
      shell.breadcrumbs.hidden = false;
    } else shell.breadcrumbs.hidden = true;
    if (!manifest.features.previousNext) { shell.pagination.hidden = true; return; }
    const at = manifest.order.findIndex((p) => p.id === page.id), prev = manifest.order[at - 1], next = manifest.order[at + 1];
    shell.pagination.replaceChildren();
    if (prev) shell.pagination.appendChild(this.pageLink(prev, this.strings.previous, "nd-page-prev")); else shell.pagination.appendChild(document.createElement("span"));
    if (next) shell.pagination.appendChild(this.pageLink(next, this.strings.next, "nd-page-next"));
    shell.pagination.hidden = !prev && !next;
  }

  private pageLink(page: ResolvedPage, direction: string, cls: string): HTMLAnchorElement {
    const a = document.createElement("a"); a.className = cls; a.href = `#/${encodeURI(page.id)}`;
    const small = document.createElement("span"); small.className = "nd-page-dir"; small.textContent = direction;
    a.append(small, document.createTextNode(page.title)); return a;
  }

  private renderLoading(): void {
    this.root.replaceChildren();
    const style = document.createElement("style"); style.textContent = styles;
    const main = document.createElement("main"); main.className = "nd-main"; main.setAttribute("aria-busy", "true"); main.innerHTML = `<div class="nd-content"><div class="nd-skeleton nd-skeleton-title"></div><div class="nd-skeleton nd-skeleton-line"></div><div class="nd-skeleton nd-skeleton-line"></div><div class="nd-skeleton nd-skeleton-line short"></div></div>`;
    this.root.append(style, main);
  }
  private renderPageLoading(): void { if (this.shell) { this.shell.content.setAttribute("aria-busy", "true"); this.shell.content.innerHTML = `<div class="nd-skeleton nd-skeleton-title"></div><div class="nd-skeleton nd-skeleton-line"></div><div class="nd-skeleton nd-skeleton-line short"></div>`; } }

  private showError(error: DocsError): void {
    this.loader?.abortPending(); this.tocView?.disconnect();
    const target = this.shell?.content;
    if (target) {
      target.removeAttribute("aria-busy"); target.replaceChildren(this.errorView(error)); this.shell!.toc.hidden = true; announce(this.shell!.live, error.message);
    } else {
      this.root.replaceChildren(); const style = document.createElement("style"); style.textContent = styles; const main = document.createElement("main"); main.className = "nd-main"; main.appendChild(this.errorView(error)); this.root.append(style, main);
    }
    this.dispatchEvent(new CustomEvent("docs-error", { detail: error, bubbles: true, composed: true }));
  }
  private errorView(error: DocsError): HTMLElement {
    const state = document.createElement("section"); state.className = "nd-state"; state.setAttribute("role", "alert");
    const h = document.createElement("h1"); h.textContent = error.code === "page-not-found" ? "Page not found" : "Documentation unavailable";
    const p = document.createElement("p"); p.textContent = error.message;
    const retry = document.createElement("button"); retry.type = "button"; retry.textContent = "Try again"; retry.addEventListener("click", () => void this.reload()); state.append(h, p, retry); return state;
  }

  private scrollToAnchor(anchor: string | null): void {
    if (!anchor || !this.shell) { window.scrollTo({ top: 0, behavior: "auto" }); return; }
    requestAnimationFrame(() => this.root.querySelector<HTMLElement>(`#${CSS.escape(anchor)}`)?.scrollIntoView({ block: "start" }));
  }
  private toggleDrawer(): void { if (!this.shell) return; const open = this.shell.app.dataset.drawerOpen !== "true"; this.shell.app.dataset.drawerOpen = String(open); this.shell.scrim.hidden = !open; this.shell.menuButton.setAttribute("aria-expanded", String(open)); this.shell.menuButton.setAttribute("aria-label", open ? this.strings.closeNav : this.strings.openNav); }
  private closeDrawer(): void { if (!this.shell) return; this.shell.app.dataset.drawerOpen = "false"; this.shell.scrim.hidden = true; this.shell.menuButton.setAttribute("aria-expanded", "false"); this.shell.menuButton.setAttribute("aria-label", this.strings.openNav); }
  private debug(cause: unknown): void { if (this.options().debug) console.debug("[nimbly-docs]", cause); }
}
