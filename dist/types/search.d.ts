import type { ResolvedManifest } from "./types.js";
/**
 * Local search.
 *
 * Titles and descriptions are searchable immediately; page bodies join the index
 * progressively, during idle time, as pages are visited. Nothing is sent to a
 * server and no third-party service is contacted.
 */
export declare class SearchController {
    private readonly mount;
    private readonly onNavigate;
    private docs;
    private dialog;
    private input;
    private sentinel;
    private query;
    private results;
    private hits;
    private active;
    constructor(manifest: ResolvedManifest, mount: HTMLElement, onNavigate: (id: string) => void);
    /** Add a rendered page to the full-text index without blocking interaction. */
    index(id: string, body: string, headings: string[]): void;
    open(query?: string): void;
    close(): void;
    isOpen(): boolean;
    destroy(): void;
    private createDialog;
    private onDialogKeydown;
    private onKeydown;
    private move;
    /** Recompute hits for the current query and repaint the list. */
    private update;
    private setQuery;
    private render;
    private paintSelection;
    private choose;
    private find;
}
