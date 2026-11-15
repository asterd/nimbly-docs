export declare const VERSION: string;
/** Manifest major version supported by this viewer. */
export declare const MANIFEST_MAJOR = 1;
/** namespaced localStorage key for the persisted palette choice. */
export declare const THEME_STORAGE_KEY = "nimbly-docs:theme";
/** namespaced localStorage key for the persisted light/dark/auto appearance choice. */
export declare const APPEARANCE_STORAGE_KEY = "nimbly-docs:appearance";
/** Palettes shipped in the bundle. Every palette defines both a light and a dark variant. */
export declare const BUILT_IN_THEMES: readonly ["nimbly", "nimbus", "midnight", "paper", "sabbia", "material", "stellar", "evergreen"];
/** The palette used when nothing else is requested or a name is unknown. */
export declare const DEFAULT_THEME = "nimbly";
/** Display names for built-in palettes; other names are title-cased. */
export declare const THEME_LABELS: Record<string, string>;
/** The three appearance states exposed by the header control. */
export declare const APPEARANCES: readonly ["light", "dark", "auto"];
/** Default brand identity used when neither an attribute nor the manifest supplies one. */
export declare const DEFAULT_BRAND_TITLE = "Nimbly Docs";
/**
 * Default, pinned diagram-engine ESM URL used only when diagram rendering is
 * explicitly enabled. We use Pele (https://github.com/obsidianmd/pele), which
 * renders Mermaid syntax to SVG at a fraction of Mermaid.js' size. Kept out of
 * the base bundle to honour the size budget; hosts under a strict CSP can
 * override it with a same-origin/self-hosted copy.
 */
export declare const DEFAULT_MERMAID_SRC = "https://cdn.jsdelivr.net/npm/pele@1/dist/pele.js";
/** namespaced localStorage prefix for per-manifest sidebar state. */
export declare const SIDEBAR_STATE_PREFIX = "nimbly-docs:sidebar:";
/** Default network timeout (ms). */
export declare const DEFAULT_TIMEOUT = 15000;
/** Validation limits (configurable via options where relevant). */
export declare const LIMITS: {
    maxSectionDepth: number;
    maxPages: number;
    maxManifestBytes: number;
    maxPageBytes: number;
    /** Number of Markdown pages kept in the in-memory LRU. */
    pageCacheSize: number;
};
/** namespaced localStorage prefix for synced tab choices (`:::tabs{sync=…}`). */
export declare const TABS_STATE_PREFIX = "nimbly-docs:tabs:";
/** Regex enforcing safe documentation version ids (used in `#/@<id>/…` routes). */
export declare const VERSION_ID_PATTERN: RegExp;
/** Regex enforcing safe, stable page/section ids. */
export declare const ID_PATTERN: RegExp;
