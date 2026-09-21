/**
 * Public type definitions for Nimbly Docs.
 *
 * These describe the manifest contract (v1) and the internal, normalized model
 * the viewer works with after validation.
 */
/** Semantic feature toggles declared by the manifest. All are optional and default to `true`. */
export interface ManifestFeatures {
    search?: boolean;
    toc?: boolean;
    copyCode?: boolean;
    previousNext?: boolean;
    breadcrumbs?: boolean;
    editLink?: boolean;
    sidebar?: {
        collapsible?: boolean;
        /** Section ids expanded on first load. */
        defaultExpanded?: string[];
    };
}
/** A single documentation page entry in the manifest. */
export interface ManifestPage {
    id: string;
    title: string;
    /** URL to the Markdown source, resolved relative to the manifest URL. */
    source: string;
    /** Optional short description used in search and metadata. */
    description?: string;
    /** Optional badge shown next to the page in the sidebar (e.g. "new", "beta"). */
    badge?: string;
    /** Hide from the sidebar but keep routable. */
    hidden?: boolean;
}
/** A navigable group of pages. Sections may nest one level of subsections. */
export interface ManifestSection {
    id: string;
    title: string;
    /** Optional icon key (a small built-in glyph set). */
    icon?: string;
    pages?: ManifestPage[];
    /** Optional nested sections (single level of nesting supported in v1). */
    sections?: ManifestSection[];
    /** Collapse this section by default. */
    collapsed?: boolean;
}
/** A theme override that may only tweak a validated allow-list of CSS tokens. */
export interface ManifestThemeTokens {
    [token: string]: string;
}
/** A named custom theme defined in the manifest. */
export interface ManifestTheme {
    name: string;
    /** Base theme to extend: one of the built-ins. */
    base?: BuiltInTheme;
    /** Token overrides for light mode. */
    light?: ManifestThemeTokens;
    /** Token overrides for dark mode. */
    dark?: ManifestThemeTokens;
}
export type BuiltInTheme = "nimbus" | "midnight" | "paper" | "sabbia";
/** The raw manifest as authored (before normalization). */
export interface Manifest {
    $schema?: string;
    version: string;
    title: string;
    description?: string;
    language?: string;
    /** Default theme: a built-in name, a custom theme name, or "auto". */
    theme?: string;
    /** Logo URL (relative to manifest) or inline text handled by `title`. */
    logo?: string;
    /** id of the page shown when the route is empty. */
    home?: string;
    /** Base URL used to build "edit this page" links, e.g. a repo tree URL. */
    editBase?: string;
    /** Footer HTML-free text rendered at the bottom of the content. */
    footer?: string;
    features?: ManifestFeatures;
    themes?: ManifestTheme[];
    sections: ManifestSection[];
}
/** A page flattened into a lookup table with its resolved absolute source URL. */
export interface ResolvedPage extends ManifestPage {
    /** Absolute URL of the Markdown source. */
    url: string;
    /** Section path (titles) for breadcrumbs. */
    sectionPath: string[];
}
/** The normalized manifest the viewer operates on. */
export interface ResolvedManifest {
    raw: Manifest;
    manifestUrl: string;
    title: string;
    language: string;
    theme: string;
    homeId: string;
    features: Required<Omit<ManifestFeatures, "sidebar">> & {
        sidebar: {
            collapsible: boolean;
            defaultExpanded: string[];
        };
    };
    /** Ordered list of all pages, for previous/next navigation. */
    order: ResolvedPage[];
    /** id -> page lookup. */
    pages: Map<string, ResolvedPage>;
    sections: ManifestSection[];
    themes: Map<string, ManifestTheme>;
    logo?: string;
    editBase?: string;
    footer?: string;
}
/** Structured error emitted through the `docs-error` event. */
export interface DocsError {
    code: "manifest-fetch" | "manifest-invalid" | "page-not-found" | "page-fetch" | "page-too-large" | "network-timeout" | "offline" | "unknown";
    message: string;
    cause?: unknown;
}
/** A heading extracted from rendered Markdown, used for the TOC. */
export interface TocEntry {
    id: string;
    text: string;
    level: number;
}
/** The result of rendering a Markdown document. */
export interface RenderedDoc {
    html: string;
    toc: TocEntry[];
    /** Plain text extracted for the search index. */
    text: string;
}
/** A single entry in the search index. */
export interface SearchDoc {
    id: string;
    title: string;
    sectionPath: string[];
    headings: string[];
    body: string;
}
/** A search hit with a relevance score and a contextual snippet. */
export interface SearchHit {
    id: string;
    title: string;
    sectionPath: string[];
    snippet: string;
    score: number;
}
/** Options passed to the viewer, merged from attributes and defaults. */
export interface ViewerOptions {
    manifest: string;
    theme: string;
    locale: string;
    router: "hash";
    search: boolean;
    toc: "auto" | "on" | "off";
    sidebar: "auto" | "open" | "closed";
    debug: boolean;
    /** Network timeout in milliseconds. */
    timeout: number;
    /** Max Markdown size accepted, in bytes. */
    maxPageBytes: number;
    /** Enable optional, lazily-loaded Mermaid diagram rendering. */
    mermaid: boolean;
    /** Pinned Mermaid ESM URL used only when `mermaid` is enabled. */
    mermaidSrc: string;
}
/** A locally registered plugin. Plugins are never loaded from the manifest. */
export interface NimblyPlugin {
    name: string;
    /** Called once after the manifest is resolved. */
    setup?(ctx: PluginContext): void;
    /** Transform the parsed HTML string before sanitization. Must return HTML. */
    transformHtml?(html: string, page: ResolvedPage): string;
    /** Called after a page node is mounted in the DOM. */
    onPageRendered?(root: DocumentFragment | HTMLElement, page: ResolvedPage): void;
}
/** Context handed to plugins during setup. */
export interface PluginContext {
    manifest: ResolvedManifest;
    navigate(id: string): void;
    setTheme(name: string): void;
}
