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
/**
 * Build the semantic application shell. Only static, authored markup is assigned
 * as HTML; every manifest/attribute value is set via textContent/setAttribute so
 * untrusted strings can never become markup.
 */
export declare function createShell(config: ShellConfig): ShellRefs;
/**
 * Build (or rebuild) the header language selector. Returns the select element,
 * or null when the docs are single-language.
 */
export declare function renderLanguageSelector(refs: ShellRefs, languages: ManifestLanguage[], active: string, label: string): HTMLButtonElement | null;
/** A small popover listing the available languages. */
export declare function renderLanguageMenu(refs: ShellRefs, languages: ManifestLanguage[], active: string, onSelect: (code: string) => void): void;
/** Apply (or re-apply) the brand name and optional logo, falling back to Nimbly Docs. */
export declare function applyBrand(refs: ShellRefs, brand: BrandConfig): void;
