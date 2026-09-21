/**
 * Optional Mermaid diagram support.
 *
 * Mermaid is a large library, so it is intentionally kept OUT of the base
 * bundle to honour the size budget and the "no implicit runtime dependency"
 * rule. It is loaded lazily, from a host-approved URL, ONLY when:
 *   1. the host explicitly opts in (attribute `mermaid` or manifest feature), and
 *   2. the current page actually contains a ```mermaid code block.
 *
 * The diagram source is authored content, never remote configuration, and
 * Mermaid's own security level is pinned to "strict" so it cannot execute
 * scripts, click handlers, or inject raw HTML.
 */
export interface MermaidConfig {
    /** Whether Mermaid rendering is enabled. */
    enabled: boolean;
    /** Pinned module URL to import Mermaid from (ESM). */
    src: string;
    /** Dark mode toggle so diagrams follow the active appearance. */
    dark: boolean;
}
/** True if the mounted content contains at least one Mermaid placeholder. */
export declare function hasMermaid(root: ParentNode): boolean;
/**
 * Find every ```mermaid block in the rendered content and replace it with a
 * rendered SVG. Blocks that fail to parse keep their original (escaped) source
 * so the page is never left blank.
 */
export declare function renderMermaid(root: ParentNode, config: MermaidConfig): Promise<void>;
