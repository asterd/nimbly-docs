/**
 * Theming is deliberately split into two independent axes:
 *
 *  - **palette** (`theme`): the colour family — a built-in or a validated
 *    manifest theme. Every palette defines both a light and a dark variant.
 *  - **appearance**: `light`, `dark` or `auto`. `auto` follows the operating
 *    system via `prefers-color-scheme` and reacts to live changes.
 *
 * Keeping these separate is what makes the header control predictable: it only
 * ever moves through three appearance states and never silently swaps palette.
 * The resolved state is published as `data-theme` and `data-scheme` on the host
 * so the stylesheet stays fully declarative.
 */
import {
  APPEARANCE_STORAGE_KEY,
  APPEARANCES,
  BUILT_IN_THEMES,
  THEME_STORAGE_KEY,
} from "./constants.js";
import type { ManifestTheme, ResolvedManifest } from "./types.js";

export type Appearance = (typeof APPEARANCES)[number];
export type BuiltInTheme = (typeof BUILT_IN_THEMES)[number];

/** Resolved, renderable theme state. */
export interface ThemeState {
  /** The active palette name. */
  theme: string;
  /** The user's appearance preference. */
  appearance: Appearance;
  /** The concrete scheme currently painted. */
  scheme: "light" | "dark";
}

/** CSS custom properties a manifest theme may override. Anything else is ignored. */
const TOKEN_ALLOWLIST = new Set([
  "color-bg", "color-surface", "color-surface-raised", "color-text", "color-muted",
  "color-brand", "color-brand-strong", "color-border", "color-code-bg", "color-code-text",
  "color-focus", "font-body", "font-mono", "content-max-width", "radius", "shadow",
]);

const BUILT_INS = new Set<string>(BUILT_IN_THEMES);

function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage can be unavailable or full */ }
}

function isAppearance(value: string | null): value is Appearance {
  return value !== null && (APPEARANCES as readonly string[]).includes(value);
}

export class ThemeManager {
  private state: ThemeState = { theme: "nimbus", appearance: "auto", scheme: "light" };
  private query: MediaQueryList | null = null;
  private readonly onSchemeChange = (): void => {
    // Only `auto` follows the OS; an explicit choice must never be overridden.
    if (this.state.appearance === "auto") this.apply();
  };

  constructor(
    private readonly host: HTMLElement,
    private readonly manifest: ResolvedManifest,
    private readonly onChange: (state: ThemeState) => void
  ) {
    this.query = window.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
    this.query?.addEventListener?.("change", this.onSchemeChange);
  }

  /**
   * Resolve the initial state. Explicit attributes win over persisted choices,
   * which in turn win over the manifest default.
   */
  initialize(themeAttribute: string | null, appearanceAttribute: string | null): ThemeState {
    // A legacy `theme="dark"|"light"|"auto"` value is treated as an appearance.
    let theme = themeAttribute;
    let appearance = appearanceAttribute;
    if (isAppearance(theme)) {
      appearance = appearance ?? theme;
      theme = null;
    }
    this.state.theme = this.resolveTheme(theme ?? storageGet(THEME_STORAGE_KEY) ?? this.manifest.theme);
    this.state.appearance = isAppearance(appearance)
      ? appearance
      : isAppearance(storageGet(APPEARANCE_STORAGE_KEY))
        ? (storageGet(APPEARANCE_STORAGE_KEY) as Appearance)
        : "auto";
    return this.apply();
  }

  /** Select a palette, keeping the current appearance untouched. */
  setTheme(name: string, persist = true): ThemeState {
    this.state.theme = this.resolveTheme(name);
    if (persist) storageSet(THEME_STORAGE_KEY, this.state.theme);
    return this.apply();
  }

  /** Select light, dark or auto, keeping the current palette untouched. */
  setAppearance(value: string, persist = true): ThemeState {
    this.state.appearance = isAppearance(value) ? value : "auto";
    if (persist) storageSet(APPEARANCE_STORAGE_KEY, this.state.appearance);
    return this.apply();
  }

  /** Advance the appearance control through exactly three predictable states. */
  cycleAppearance(): ThemeState {
    const order: Appearance[] = ["light", "dark", "auto"];
    const next = order[(order.indexOf(this.state.appearance) + 1) % order.length]!;
    return this.setAppearance(next);
  }

  get(): ThemeState { return { ...this.state }; }

  /** Palette names available for selection, built-ins first. */
  themes(): string[] {
    return [...BUILT_IN_THEMES, ...[...this.manifest.themes.keys()].filter((n) => !BUILT_INS.has(n))];
  }

  destroy(): void {
    this.query?.removeEventListener?.("change", this.onSchemeChange);
    this.query = null;
  }

  private resolveTheme(name: string | null | undefined): string {
    if (!name) return "nimbus";
    if (BUILT_INS.has(name) || this.manifest.themes.has(name)) return name;
    return "nimbus";
  }

  private prefersDark(): boolean {
    return this.query?.matches ?? false;
  }

  /** Publish the resolved state to the host element and re-apply custom tokens. */
  private apply(): ThemeState {
    const scheme: "light" | "dark" =
      this.state.appearance === "auto" ? (this.prefersDark() ? "dark" : "light") : this.state.appearance;
    this.state.scheme = scheme;

    this.host.setAttribute("data-theme", this.state.theme);
    this.host.setAttribute("data-scheme", scheme);
    this.host.setAttribute("data-appearance", this.state.appearance);

    const custom = this.manifest.themes.get(this.state.theme);
    this.clearTokens();
    if (custom) {
      // A custom palette inherits a built-in base, then layers validated tokens.
      const base = custom.base && BUILT_INS.has(custom.base) ? custom.base : "nimbus";
      this.host.setAttribute("data-theme-base", base);
      this.applyTokens(custom, scheme);
    } else {
      this.host.removeAttribute("data-theme-base");
    }

    const snapshot = this.get();
    this.onChange(snapshot);
    return snapshot;
  }

  private clearTokens(): void {
    for (const token of TOKEN_ALLOWLIST) this.host.style.removeProperty(`--dv-${token}`);
  }

  private applyTokens(theme: ManifestTheme, scheme: "light" | "dark"): void {
    // Fall back to the light token set when a theme only defines one variant.
    const tokens = (scheme === "dark" ? theme.dark : theme.light) ?? theme.light ?? theme.dark ?? {};
    for (const [token, value] of Object.entries(tokens)) {
      if (TOKEN_ALLOWLIST.has(token)) this.host.style.setProperty(`--dv-${token}`, value);
    }
  }
}
