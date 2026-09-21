import type { TocEntry } from "./types.js";
export declare class Toc {
    private readonly host;
    private readonly onNavigate;
    private observer;
    constructor(host: HTMLElement, onNavigate: () => void);
    render(pageId: string, entries: TocEntry[]): void;
    disconnect(): void;
    private observe;
}
