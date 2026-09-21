import type { DocsError } from "./types.js";
export declare class LoaderError extends Error {
    code: DocsError["code"];
    cause?: unknown;
    constructor(code: DocsError["code"], message: string, cause?: unknown);
}
export interface LoaderOptions {
    timeout: number;
    maxPageBytes: number;
}
export declare class Loader {
    private readonly opts;
    private pageCache;
    /** Tracks the in-flight page request so a new navigation can cancel it. */
    private inflight;
    constructor(opts: LoaderOptions);
    /** Fetch and parse a JSON manifest. Not cached across reloads (short server cache is expected). */
    fetchManifest(url: string): Promise<unknown>;
    /** Fetch Markdown by URL, using the LRU cache and cancelling any prior page fetch. */
    fetchPage(url: string): Promise<string>;
    /** Abort the current in-flight page request, if any. */
    abortPending(): void;
    clearCache(): void;
    private fetchText;
}
