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
    pageTools: string;
    downloads: string;
    downloadSource: string;
    downloadPage: string;
    downloadFiles: string;
    revision: string;
    revisionDate: string;
    revisionBranch: string;
    revisionCommit: string;
    revisionSource: string;
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
    backToApp: string;
    theme: string;
    /** Default callout titles. */
    note: string;
    tip: string;
    important: string;
    warning: string;
    danger: string;
    /** Version selector label. */
    version: string;
    /** Banner for legacy versions; `{version}` is replaced by the version label. */
    versionLegacy: string;
    /** Banner for unreleased versions; `{version}` is replaced by the version label. */
    versionUnreleased: string;
    /** Link from a version banner to the default version. */
    versionLatest: string;
    /** Integrated API reference. */
    apiSpec: string;
    apiEndpoints: string;
    apiParameters: string;
    apiRequestBody: string;
    apiResponses: string;
    apiHeaders: string;
    apiSchemas: string;
    apiSchema: string;
    apiExample: string;
    apiProperties: string;
    apiServers: string;
    apiAuth: string;
    apiRequired: string;
    apiDeprecated: string;
    apiEnum: string;
    apiDefault: string;
    apiOneOf: string;
    apiAnyOf: string;
    apiRecursive: string;
    apiFilter: string;
    apiExpandAll: string;
    apiCollapseAll: string;
    apiNoMatch: string;
    /** Image viewer. */
    viewerOpen: string;
    viewerClose: string;
    viewerPrevious: string;
    viewerNext: string;
    viewerZoomIn: string;
    viewerZoomOut: string;
    viewerOriginal: string;
}
/** Resolve the UI strings for a locale, falling back to English per key. */
export declare function stringsFor(locale: string): UIStrings;
export declare function persistedLocale(): string | null;
export declare function persistLocale(code: string): void;
export { APPEARANCE_STORAGE_KEY };
