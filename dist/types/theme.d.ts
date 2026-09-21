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
import { APPEARANCES, BUILT_IN_THEMES } from "./constants.js";
import type { ResolvedManifest } from "./types.js";
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
export declare class ThemeManager {
    private readonly host;
    private readonly manifest;
    private readonly onChange;
    private state;
    private query;
    private readonly onSchemeChange;
    constructor(host: HTMLElement, manifest: ResolvedManifest, onChange: (state: ThemeState) => void);
    /**
     * Resolve the initial state. Explicit attributes win over persisted choices,
     * which in turn win over the manifest default.
     */
    initialize(themeAttribute: string | null, appearanceAttribute: string | null): ThemeState;
    /** Select a palette, keeping the current appearance untouched. */
    setTheme(name: string, persist?: boolean): ThemeState;
    /** Select light, dark or auto, keeping the current palette untouched. */
    setAppearance(value: string, persist?: boolean): ThemeState;
    /** Advance the appearance control through exactly three predictable states. */
    cycleAppearance(): ThemeState;
    get(): ThemeState;
    /** Palette names available for selection, built-ins first. */
    themes(): string[];
    destroy(): void;
    private resolveTheme;
    private prefersDark;
    /** Publish the resolved state to the host element and re-apply custom tokens. */
    private apply;
    private clearTokens;
    private applyTokens;
}
