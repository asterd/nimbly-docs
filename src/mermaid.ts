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

interface MermaidApi {
  initialize(config: Record<string, unknown>): void;
  render(id: string, text: string): Promise<{ svg: string; bindFunctions?: (el: Element) => void }>;
}

let loader: Promise<MermaidApi | null> | null = null;
let counter = 0;

async function load(src: string): Promise<MermaidApi | null> {
  if (!loader) {
    loader = import(/* @vite-ignore */ src)
      .then((mod: { default?: MermaidApi } & Partial<MermaidApi>) => (mod.default ?? (mod as unknown as MermaidApi)))
      .catch(() => null);
  }
  return loader;
}

/** True if the mounted content contains at least one Mermaid placeholder. */
export function hasMermaid(root: ParentNode): boolean {
  return root.querySelector('pre > code[data-lang="mermaid"]') !== null;
}

/**
 * Find every ```mermaid block in the rendered content and replace it with a
 * rendered SVG. Blocks that fail to parse keep their original (escaped) source
 * so the page is never left blank.
 */
export async function renderMermaid(root: ParentNode, config: MermaidConfig): Promise<void> {
  if (!config.enabled) return;
  const blocks = Array.from(root.querySelectorAll<HTMLElement>('pre > code[data-lang="mermaid"]'));
  if (blocks.length === 0) return;

  const mermaid = await load(config.src);
  if (!mermaid) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: config.dark ? "dark" : "default",
    flowchart: { htmlLabels: false },
  });

  for (const code of blocks) {
    const pre = code.parentElement;
    if (!pre) continue;
    const source = code.textContent ?? "";
    const id = `nd-mermaid-${Date.now().toString(36)}-${counter++}`;
    try {
      const { svg } = await mermaid.render(id, source);
      const figure = document.createElement("figure");
      figure.className = "nd-mermaid";
      // `svg` is produced by Mermaid in strict mode (no scripts/handlers). We
      // parse it inertly and adopt only the <svg> root to avoid document.write.
      const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
      const el = parsed.documentElement;
      if (el && el.nodeName.toLowerCase() === "svg") {
        figure.appendChild(document.importNode(el, true));
        // Replace the wrapping codeblock (pre or its .nd-codeblock wrapper).
        const target = pre.closest(".nd-codeblock") ?? pre;
        target.replaceWith(figure);
      }
    } catch {
      // Leave the original code block in place on parse failure.
    }
  }
}
