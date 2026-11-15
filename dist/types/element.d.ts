import { type Appearance } from "./theme.js";
import type { NimblyPlugin } from "./types.js";
/** The secure, embeddable Nimbly Docs custom element. */
export declare class NimblyDocsElement extends HTMLElement {
    static readonly version: string;
    static readonly plugins: NimblyPlugin[];
    static get observedAttributes(): string[];
    /** Register a local, application-owned plugin. Remote manifest plugins are intentionally unsupported. */
    static use(plugin: NimblyPlugin): void;
    private readonly root;
    private readonly router;
    private loader;
    private manifest;
    private shell;
    private sidebarView;
    private tocView;
    private searchView;
    private themes;
    private initialized;
    private navigating;
    private locale;
    private strings;
    private rawManifest;
    private rootManifest;
    private manifestUrl;
    /** Versions declared by the root manifest; version manifests never redefine them. */
    private versions;
    private activeVersion;
    /** Set when a version switch keeps the current page id, which may not exist there. */
    private versionFallback;
    private currentPageId;
    private keydownBound;
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    /** Navigate to a known page id, optionally to its heading id. */
    navigate(id: string, anchor?: string): void;
    /** Re-fetch and validate the manifest, retaining the UI shell only when successful. */
    reload(): Promise<void>;
    /** Select a colour palette. Returns the applied palette name. */
    setTheme(name: string): string;
    /** Select light, dark or auto appearance. Returns the applied appearance. */
    setAppearance(value: string): Appearance;
    /** Switch to a documentation version by id, keeping the current page when it exists there. */
    setVersion(id: string): void;
    /** Open the full client-side search dialog. */
    openSearch(): void;
    /** Cycle to the next available colour palette (built-ins then manifest themes). */
    cyclePalette(): string;
    /** Switch the active content/UI language and re-render the current page. */
    setLocale(code: string): void;
    /** Resolve the initial locale from attribute, storage, then manifest default. */
    private resolveLocale;
    /** Mark only a direct-body viewer as page-owned; embedded viewers keep host layout. */
    private syncPageMode;
    /** Visible platform-aware shortcut hint, while the actual key handling stays Cmd/Ctrl+K. */
    private searchShortcut;
    private options;
    /** Resolve the brand from attributes, then the manifest, then the built-in default. */
    private brandConfig;
    private initialize;
    private mountShell;
    private onGlobalKeydown;
    /** Reflect resolved theme state onto the appearance button icon and label. */
    private onThemeChange;
    /** Render any Mermaid-syntax diagrams in the current page (via Pele). */
    private renderDiagrams;
    private refreshBrand;
    /** Resolve a route's `@version` to a declared version; unknown or absent ids mean the default. */
    private versionFor;
    /**
     * Load another version's manifest and re-mount the shell around it, then
     * replay the current route. The version list always comes from the root.
     */
    private activateVersion;
    private renderVersionBanner;
    private onRoute;
    private renderMeta;
    private pageLink;
    private renderLoading;
    private renderPageLoading;
    private showError;
    private errorView;
    private scrollToAnchor;
    private toggleDrawer;
    private closeDrawer;
    private debug;
}
