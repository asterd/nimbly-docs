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
    /** Open the full client-side search dialog. */
    openSearch(): void;
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
    /** Render any Mermaid diagrams in the current page, honouring the active scheme. */
    private renderDiagrams;
    private refreshBrand;
    private cyclePalette;
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
