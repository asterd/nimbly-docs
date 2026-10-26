export declare function normalizeLang(lang: string | undefined): string | null;
/**
 * Highlight `code` for the given language, returning safe HTML.
 * When the language is unsupported, the code is returned HTML-escaped, unstyled.
 */
export declare function highlight(code: string, lang: string | null): string;
