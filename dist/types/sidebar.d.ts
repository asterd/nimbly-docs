import type { ResolvedManifest } from "./types.js";
export declare class Sidebar {
    private readonly host;
    private readonly manifest;
    private readonly onNavigate;
    private readonly navTitle;
    private expanded;
    private storageKey;
    constructor(host: HTMLElement, manifest: ResolvedManifest, onNavigate: () => void, navTitle?: string);
    render(activePageId: string): void;
    private renderSection;
    private renderPage;
    private sectionContains;
    private loadState;
    private saveState;
}
