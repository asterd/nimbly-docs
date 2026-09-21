export declare const VERSION: string;
/** Manifest major version supported by this viewer. */
export declare const MANIFEST_MAJOR = 1;
/** namespaced localStorage key for the persisted palette choice. */
export declare const THEME_STORAGE_KEY = "nimbly-docs:theme";
/** namespaced localStorage key for the persisted light/dark/auto appearance choice. */
export declare const APPEARANCE_STORAGE_KEY = "nimbly-docs:appearance";
/** Palettes shipped in the bundle. Every palette defines both a light and a dark variant. */
export declare const BUILT_IN_THEMES: readonly ["nimbus", "midnight", "paper", "sabbia"];
/** The three appearance states exposed by the header control. */
export declare const APPEARANCES: readonly ["light", "dark", "auto"];
/** Default brand identity used when neither an attribute nor the manifest supplies one. */
export declare const DEFAULT_BRAND_TITLE = "Nimbly Docs";
/**
 * Default, pinned Mermaid ESM URL used only when diagram rendering is explicitly
 * enabled. Kept out of the base bundle to honour the size budget; hosts under a
 * strict CSP can override it with a same-origin/self-hosted copy.
 */
export declare const DEFAULT_MERMAID_SRC = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
/** namespaced localStorage prefix for per-manifest sidebar state. */
export declare const SIDEBAR_STATE_PREFIX = "nimbly-docs:sidebar:";
/** Default network timeout (ms). */
export declare const DEFAULT_TIMEOUT = 15000;
/** Validation limits (configurable via options where relevant). */
export declare const LIMITS: {
    maxPages: number;
    maxManifestBytes: number;
    maxPageBytes: number;
    /** Number of Markdown pages kept in the in-memory LRU. */
    pageCacheSize: number;
};
/** Regex enforcing safe, stable page/section ids. */
export declare const ID_PATTERN: RegExp;
