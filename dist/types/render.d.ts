import type { ResolvedManifest, ResolvedPage, RenderedDoc, NimblyPlugin } from "./types.js";
export interface RenderContext {
    manifest: ResolvedManifest;
    page: ResolvedPage;
    debug: boolean;
    copyCode: boolean;
    plugins: NimblyPlugin[];
}
export interface RenderResult {
    fragment: DocumentFragment;
    doc: RenderedDoc;
}
/**
 * Turn Markdown source into a mounted-ready fragment.
 * `baseUrl` is the URL of the Markdown file, used to resolve relative links/images.
 */
export declare function renderContent(markdown: string, ctx: RenderContext): RenderResult;
/** Handle a delegated click on a copy button. Returns true if handled. */
export declare function handleCopyClick(target: EventTarget | null): Promise<boolean>;
