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

/** Minimal surface of the Pele API we depend on. */
interface PeleApi {
  render(
    source: string,
    options?: { fontFamily?: string; idPrefix?: string; maxWidth?: number; responsive?: boolean },
  ): { svg: string };
}

let loader: Promise<PeleApi | null> | null = null;
let counter = 0;

async function load(src: string): Promise<PeleApi | null> {
  if (!loader) {
    loader = import(/* @vite-ignore */ src)
      .then((mod: Partial<PeleApi> & { default?: Partial<PeleApi> }) => {
        const api = (mod.render ? mod : mod.default) as PeleApi | undefined;
        return api && typeof api.render === "function" ? api : null;
      })
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
 *
 * Colours come from CSS variables (`--pele-*`) set on the `.nd-mermaid`
 * wrapper, so diagrams follow light/dark without being re-rendered.
 */
export async function renderMermaid(root: ParentNode, config: MermaidConfig): Promise<void> {
  if (!config.enabled) return;
  const blocks = Array.from(root.querySelectorAll<HTMLElement>('pre > code[data-lang="mermaid"]'));
  if (blocks.length === 0) return;

  const pele = await load(config.src);
  if (!pele) return;

  for (const code of blocks) {
    const pre = code.parentElement;
    if (!pre) continue;
    const source = code.textContent ?? "";
    const prefix = `nd-mermaid-${Date.now().toString(36)}-${counter++}`;
    try {
      // Measure labels with the same font the content uses.
      const fontFamily = getComputedStyle(code).fontFamily || undefined;
      const { svg } = pele.render(source, { fontFamily, idPrefix: prefix, responsive: true });
      const figure = document.createElement("figure");
      figure.className = "nd-mermaid";
      // Parse inertly and adopt only the <svg> root to avoid document.write.
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
