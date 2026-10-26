import type { RenderedDoc } from "./types.js";
export interface MarkdownOptions {
    /** Called to convert a heading text to a slug id. */
    slug?: (text: string, used: Set<string>) => string;
    /** Highlight fenced code blocks. Default true. */
    highlightCode?: boolean;
}
export declare function slugify(text: string, used: Set<string>): string;
/** Parse Markdown into rendered HTML, a TOC, and plain text for search. */
export declare function renderMarkdown(input: string, options?: MarkdownOptions): RenderedDoc;
/** Render inline Markdown (bold, italic, code, links, images) to safe HTML. */
export declare function renderInline(text: string): string;
/** Strip inline Markdown/HTML for plain-text extraction (search, TOC). */
export declare function stripInline(text: string): string;
