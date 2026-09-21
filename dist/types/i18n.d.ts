/**
 * Lightweight UI localization.
 *
 * Only the handful of chrome strings the viewer renders are translated here.
 * Documentation content itself is authored Markdown (optionally per-locale via
 * `page.sources`), so there is no runtime translation engine and no weight cost
 * beyond this small dictionary.
 */
import { APPEARANCE_STORAGE_KEY } from "./constants.js";
export interface UIStrings {
    searchPlaceholder: string;
    searchAria: string;
    onThisPage: string;
    documentation: string;
    previous: string;
    next: string;
    closeSearch: string;
    noResults: string;
    startTyping: string;
    openNav: string;
    closeNav: string;
    skipToContent: string;
    language: string;
    apiReference: string;
    poweredBy: string;
}
/** Resolve the UI strings for a locale, falling back to English per key. */
export declare function stringsFor(locale: string): UIStrings;
export declare function persistedLocale(): string | null;
export declare function persistLocale(code: string): void;
export { APPEARANCE_STORAGE_KEY };
