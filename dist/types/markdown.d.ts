import type { RenderedDoc } from "./types.js";
export interface MarkdownOptions {
    /** Called to convert a heading text to a slug id. */
    slug?: (text: string, used: Set<string>) => string;
    /** Highlight fenced code blocks. Default true. */
    highlightCode?: boolean;
    /** @internal Heading ids already used, shared with nested renders so ids stay unique. */
    usedIds?: Set<string>;
}
/** Callout kinds produced by `:::<kind>` directives and GitHub alerts. */
export declare const CALLOUT_KINDS: readonly ["note", "tip", "important", "warning", "danger"];
export type CalloutKind = (typeof CALLOUT_KINDS)[number];
export declare function slugify(text: string, used: Set<string>): string;
/** Parse Markdown into rendered HTML, a TOC, and plain text for search. */
export declare function renderMarkdown(input: string, options?: MarkdownOptions): RenderedDoc;
/** Pick a colour tone for a badge from its text. Unknown words stay neutral. */
export declare function badgeTone(badge: string): string;
/** Render inline Markdown (bold, italic, code, links, images) to safe HTML. */
export declare function renderInline(text: string): string;
/** Strip inline Markdown/HTML for plain-text extraction (search, TOC). */
export declare function stripInline(text: string): string;
