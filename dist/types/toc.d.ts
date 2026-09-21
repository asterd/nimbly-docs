import type { TocEntry } from "./types.js";
export declare class Toc {
    private readonly host;
    private readonly onNavigate;
    private readonly title;
    private observer;
    constructor(host: HTMLElement, onNavigate: () => void, title?: string);
    render(pageId: string, entries: TocEntry[]): void;
    disconnect(): void;
    private observe;
}
