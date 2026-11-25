/**
 * Optional plugin: show Archify diagrams inside a page.
 *
 * Archify (https://github.com/tt-a1i/archify) turns a typed JSON description
 * into ONE standalone, interactive HTML file. That file contains a script, so
 * it can never be inlined into Markdown (the sanitizer removes scripts and
 * iframes by design). This plugin is the narrow, explicit exception:
 *
 *   [Architecture map](./diagrams/app.html "archify ratio=1080:640")
 *
 * A normal Markdown link whose title starts with `archify` becomes a framed,
 * sandboxed viewer. Without the plugin the same line is just a working link, so
 * the Markdown stays portable and degrades gracefully.
 *
 * Guard rails (all enforced here, none configurable):
 *  - the host must opt in with `archify-base="./diagrams/"` on <nimbly-docs>;
 *  - only same-origin `.html` files under that folder are ever framed;
 *  - the frame is `sandbox="allow-scripts allow-downloads allow-popups"`, with
 *    NO `allow-same-origin`: the diagram runs in an opaque origin and cannot
 *    read the host page, its storage or its cookies;
 *  - the frame URL is rebuilt from validated parts (embed + theme parameters).
 *
 * This file is a separate build artifact. The core bundle does not import it.
 */
import type { NimblyPlugin } from "../types.js";
export interface ArchifyEmbedSpec {
    /** Fixed frame height in px (used when there is no ratio). */
    height: number;
    /** Width:height of the diagram canvas; the frame follows the column width. */
    ratio: [number, number] | null;
}
/** Parse a link title. Returns null when the link is not an Archify embed. */
export declare function parseSpec(title: string | null | undefined): ArchifyEmbedSpec | null;
/**
 * Validate a link target. Returns the URL that may be framed, or null.
 * `base` is the host-approved folder (the `archify-base` attribute).
 */
export declare function resolveEmbedUrl(href: string, base: string, location: {
    href: string;
    origin: string;
}): URL | null;
/** Build the final frame URL: Archify's own embed mode plus the host's colour scheme. */
export declare function frameUrl(url: URL, scheme: "light" | "dark"): string;
/** Link to the same diagram as a full page (Archify's own toolbar included). */
export declare function standaloneUrl(url: URL, scheme: "light" | "dark"): string;
/** Upgrade every Archify link inside `root`. Safe to call repeatedly. */
export declare function enhance(root: ParentNode): number;
export declare const archifyEmbed: NimblyPlugin;
