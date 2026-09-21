/** Brand identity resolved from attributes, then the manifest, then defaults. */
export interface BrandConfig {
    title: string;
    logo?: string;
}
export interface ShellConfig {
    brand: BrandConfig;
    search: boolean;
    /** Label displayed in the search trigger, e.g. ⌘ K or Ctrl K. */
    shortcut: string;
    /** Show the palette switcher (only meaningful with more than one palette). */
    palette: boolean;
}
export interface ShellRefs {
    app: HTMLElement;
    brand: HTMLAnchorElement;
    brandLabel: HTMLElement;
    brandMark: HTMLElement;
    menuButton: HTMLButtonElement;
    appearanceButton: HTMLButtonElement;
    paletteButton: HTMLButtonElement;
    search: HTMLElement;
    searchButton: HTMLButtonElement;
    sidebar: HTMLElement;
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
 * Build the semantic application shell.
 *
 * Only static, authored markup is assigned as HTML; every value that originates
 * from a manifest or an attribute is set through `textContent`/`setAttribute`
 * so untrusted strings can never become markup.
 */
export declare function createShell(config: ShellConfig): ShellRefs;
/** Apply (or re-apply) the brand name and optional logo, falling back to Nimbly Docs. */
export declare function applyBrand(refs: ShellRefs, brand: BrandConfig): void;
