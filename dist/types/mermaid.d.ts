/**
 * Optional Mermaid-syntax diagram support, rendered by Pele.
 *
 * Pele (https://github.com/obsidianmd/pele) renders Mermaid *syntax* to SVG
 * with its own parser and layout engine. It is roughly 7x smaller than
 * Mermaid.js, synchronous, and themeable through CSS variables — so diagrams
 * follow the active appearance WITHOUT a re-render.
 *
 * It is still intentionally kept OUT of the base bundle to honour the size
 * budget and the "no implicit runtime dependency" rule. It is loaded lazily,
 * from a host-approved URL, ONLY when:
 *   1. the host explicitly opts in (attribute `mermaid` or manifest feature), and
 *   2. the current page actually contains a ```mermaid code block.
 *
 * The diagram source is authored content, never remote configuration. Pele
 * escapes diagram text, filters links/styles and caps input/output size, so a
 * diagram cannot execute scripts or inject raw HTML. We additionally pass the
 * rendered SVG through an inert DOMParser and adopt only the <svg> root.
 */
export interface MermaidConfig {
    /** Whether diagram rendering is enabled. */
    enabled: boolean;
    /** Pinned module URL to import Pele from (ESM). */
    src: string;
    /**
     * Dark mode flag. Kept for API compatibility; Pele reacts to CSS variables,
     * so the scheme is driven by the host stylesheet rather than this flag.
     */
    dark: boolean;
}
/** True if the mounted content contains at least one Mermaid placeholder. */
export declare function hasMermaid(root: ParentNode): boolean;
/**
 * Find every ```mermaid block in the rendered content and replace it with a
 * rendered SVG. Blocks that fail to parse keep their original (escaped) source
 * so the page is never left blank.
 *
 * Colours come from CSS variables (`--pele-*`) set on the `.nd-mermaid`
 * wrapper, so diagrams follow light/dark without being re-rendered.
 */
export declare function renderMermaid(root: ParentNode, config: MermaidConfig): Promise<void>;
