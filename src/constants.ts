/** Build-time injected version string. */
declare const __NIMBLY_VERSION__: string;
export const VERSION = typeof __NIMBLY_VERSION__ !== "undefined" ? __NIMBLY_VERSION__ : "0.0.0-dev";

/** Manifest major version supported by this viewer. */
export const MANIFEST_MAJOR = 1;

/** namespaced localStorage key for the persisted palette choice. */
export const THEME_STORAGE_KEY = "nimbly-docs:theme";

/** namespaced localStorage key for the persisted light/dark/auto appearance choice. */
export const APPEARANCE_STORAGE_KEY = "nimbly-docs:appearance";

/** Palettes shipped in the bundle. Every palette defines both a light and a dark variant. */
export const BUILT_IN_THEMES = ["nimbly", "nimbus", "midnight", "paper", "sabbia", "material", "stellar", "evergreen"] as const;

/** The palette used when nothing else is requested or a name is unknown. */
export const DEFAULT_THEME = "nimbly";

/** Display names for built-in palettes; other names are title-cased. */
export const THEME_LABELS: Record<string, string> = {
  nimbly: "Nimbly Classic",
};

/** The three appearance states exposed by the header control. */
export const APPEARANCES = ["light", "dark", "auto"] as const;

/** Default brand identity used when neither an attribute nor the manifest supplies one. */
export const DEFAULT_BRAND_TITLE = "Nimbly Docs";

/**
 * Default, pinned diagram-engine ESM URL used only when diagram rendering is
 * explicitly enabled. We use Pele (https://github.com/obsidianmd/pele), which
 * renders Mermaid syntax to SVG at a fraction of Mermaid.js' size. Kept out of
 * the base bundle to honour the size budget; hosts under a strict CSP can
 * override it with a same-origin/self-hosted copy.
 */
export const DEFAULT_MERMAID_SRC = "https://cdn.jsdelivr.net/npm/pele@1/dist/pele.js";

/** namespaced localStorage prefix for per-manifest sidebar state. */
export const SIDEBAR_STATE_PREFIX = "nimbly-docs:sidebar:";

/** Default network timeout (ms). */
export const DEFAULT_TIMEOUT = 15_000;

/** Validation limits (configurable via options where relevant). */
export const LIMITS = {
  maxPages: 500,
  maxManifestBytes: 256 * 1024,
  maxPageBytes: 2 * 1024 * 1024,
  /** Number of Markdown pages kept in the in-memory LRU. */
  pageCacheSize: 10,
};

/** namespaced localStorage prefix for synced tab choices (`:::tabs{sync=…}`). */
export const TABS_STATE_PREFIX = "nimbly-docs:tabs:";

/** Regex enforcing safe documentation version ids (used in `#/@<id>/…` routes). */
export const VERSION_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,31}$/i;

/** Regex enforcing safe, stable page/section ids. */
export const ID_PATTERN = /^[a-z0-9][a-z0-9/_-]{0,127}$/;
