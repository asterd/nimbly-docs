import type { UIStrings } from "./i18n.js";
import type { ResolvedPage } from "./types.js";
/** Export the loaded source, not rendered HTML, with portable provenance. */
export declare function markdownDownload(page: ResolvedPage, markdown: string): string;
export declare function renderPageTools(page: ResolvedPage, sourceUrl: string, labels: UIStrings, sourceDownload: boolean, markdown: string): HTMLElement | null;
