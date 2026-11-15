import { type CalloutLabels } from "./components.js";
import type { ResolvedManifest, ResolvedPage, RenderedDoc, NimblyPlugin } from "./types.js";
export interface RenderContext {
    manifest: ResolvedManifest;
    page: ResolvedPage;
    /** URL the Markdown was actually fetched from; defaults to `page.url`. */
    baseUrl?: string;
    debug: boolean;
    copyCode: boolean;
    plugins: NimblyPlugin[];
    /** Localized default titles for callouts without an authored title. */
    labels: CalloutLabels;
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
