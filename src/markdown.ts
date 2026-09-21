/**
 * A compact, deterministic Markdown parser.
 *
 * Design goals from the spec:
 *  - No raw HTML passthrough (raw HTML in the source is escaped, never executed).
 *  - Stable, slug-based heading ids for the TOC and deep links.
 *  - Safe by construction: the parser only produces the small tag set the
 *    sanitizer allows, and all text is HTML-escaped.
 *
 * Supported: ATX headings, paragraphs, bold/italic/strikethrough/inline code,
 * links, images, autolinks, fenced + indented code blocks, blockquotes,
 * ordered/unordered/task lists (nested), tables (GFM), horizontal rules,
 * and hard line breaks.
 */
import { escapeHtml, escapeAttr } from "./sanitize.js";
import { highlight, normalizeLang } from "./highlight.js";
import type { RenderedDoc, TocEntry } from "./types.js";

export interface MarkdownOptions {
  /** Called to convert a heading text to a slug id. */
  slug?: (text: string, used: Set<string>) => string;
  /** Highlight fenced code blocks. Default true. */
  highlightCode?: boolean;
}

export function slugify(text: string, used: Set<string>): string {
  let base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u00C0-\u024f-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!base) base = "section";
  let id = base;
  let n = 1;
  while (used.has(id)) id = `${base}-${++n}`;
  used.add(id);
  return id;
}

/** Parse Markdown into rendered HTML, a TOC, and plain text for search. */
export function renderMarkdown(input: string, options: MarkdownOptions = {}): RenderedDoc {
  const slug = options.slug ?? slugify;
  const highlightCode = options.highlightCode !== false;
  const used = new Set<string>();
  const toc: TocEntry[] = [];
  const textParts: string[] = [];

  // Normalize line endings and expand tabs for predictable indentation math.
  const lines = input.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  const html: string[] = [];
  let i = 0;

  const pushText = (t: string) => {
    const clean = t.trim();
    if (clean) textParts.push(clean);
  };

  while (i < lines.length) {
    const line = lines[i]!;

    // Blank line
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // Fenced code block ``` or ~~~
    const fence = /^(\s*)(`{3,}|~{3,})\s*([\w+#-]*)\s*$/.exec(line);
    if (fence) {
      const marker = fence[2]!;
      const rawLang = (fence[3] || "").toLowerCase().trim();
      const lang = normalizeLang(fence[3]);
      const body: string[] = [];
      i++;
      while (i < lines.length && !new RegExp(`^\\s*${marker[0]}{${marker.length},}\\s*$`).test(lines[i]!)) {
        body.push(lines[i]!);
        i++;
      }
      i++; // consume closing fence
      const code = body.join("\n");
      pushText(code);
      // Diagram blocks (e.g. mermaid) are kept verbatim and never highlighted;
      // their language label is preserved so downstream renderers can find them.
      const isDiagram = rawLang === "mermaid";
      const inner = highlightCode && !isDiagram ? highlight(code, lang) : escapeHtml(code);
      const labelLang = lang || (rawLang ? rawLang : "");
      const langAttr = labelLang ? ` data-lang="${escapeAttr(labelLang)}"` : "";
      html.push(`<pre><code${langAttr}>${inner}\n</code></pre>`);
      continue;
    }

    // ATX heading
    const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      const raw = heading[2]!;
      const id = slug(stripInline(raw), used);
      const content = renderInline(raw);
      pushText(stripInline(raw));
      if (level >= 2 && level <= 4) toc.push({ id, text: stripInline(raw), level });
      html.push(
        `<h${level} id="${escapeAttr(id)}"><a class="nd-anchor" href="#${escapeAttr(id)}" aria-label="Link to this section">#</a>${content}</h${level}>`
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      html.push("<hr>");
      i++;
      continue;
    }

    // Blockquote
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i]!)) {
        quote.push(lines[i]!.replace(/^\s*>\s?/, ""));
        i++;
      }
      const inner = renderMarkdown(quote.join("\n"), options);
      textParts.push(inner.text);
      html.push(`<blockquote>${inner.html}</blockquote>`);
      continue;
    }

    // Table (GFM): header row, delimiter row, body rows
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]!) && /-/.test(lines[i + 1]!)) {
      const { tableHtml, consumed, text } = parseTable(lines, i);
      if (tableHtml) {
        html.push(tableHtml);
        pushText(text);
        i += consumed;
        continue;
      }
    }

    // Lists (ordered/unordered/task)
    if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(line)) {
      const { listHtml, consumed, text } = parseList(lines, i, options);
      html.push(listHtml);
      pushText(text);
      i += consumed;
      continue;
    }

    // Indented code block (4 spaces)
    if (/^ {4}\S/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && (/^ {4}/.test(lines[i]!) || /^\s*$/.test(lines[i]!))) {
        body.push(lines[i]!.replace(/^ {4}/, ""));
        i++;
      }
      const code = body.join("\n").replace(/\n+$/, "");
      pushText(code);
      html.push(`<pre><code>${escapeHtml(code)}\n</code></pre>`);
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-structural lines
    const para: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]!) &&
      !/^(#{1,6})\s+/.test(lines[i]!) &&
      !/^\s*(?:`{3,}|~{3,})/.test(lines[i]!) &&
      !/^\s*>/.test(lines[i]!) &&
      !/^\s*(?:[-*+]|\d+[.)])\s+/.test(lines[i]!) &&
      !/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i]!)
    ) {
      para.push(lines[i]!);
      i++;
    }
    const text = para.join("\n");
    pushText(stripInline(text));
    html.push(`<p>${renderInline(text)}</p>`);
  }

  return { html: html.join("\n"), toc, text: textParts.join(" ") };
}

function parseTable(lines: string[], start: number): { tableHtml: string; consumed: number; text: string } {
  const splitRow = (row: string): string[] => {
    const trimmed = row.trim().replace(/^\||\|$/g, "");
    const cells: string[] = [];
    let cur = "";
    let esc = false;
    for (const ch of trimmed) {
      if (esc) {
        cur += ch;
        esc = false;
      } else if (ch === "\\") {
        esc = true;
        cur += ch;
      } else if (ch === "|") {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };

  const header = splitRow(lines[start]!);
  const delim = splitRow(lines[start + 1]!);
  const aligns = delim.map((d) => {
    const l = d.startsWith(":");
    const r = d.endsWith(":");
    if (l && r) return "center";
    if (r) return "right";
    if (l) return "left";
    return "";
  });

  let idx = start + 2;
  const bodyRows: string[][] = [];
  while (idx < lines.length && lines[idx]!.includes("|") && !/^\s*$/.test(lines[idx]!)) {
    bodyRows.push(splitRow(lines[idx]!));
    idx++;
  }

  const textParts: string[] = [];
  const th = header
    .map((h, k) => {
      textParts.push(stripInline(h));
      const a = aligns[k] ? ` align="${aligns[k]}"` : "";
      return `<th scope="col"${a}>${renderInline(h)}</th>`;
    })
    .join("");
  const body = bodyRows
    .map(
      (r) =>
        `<tr>${r
          .map((c, k) => {
            textParts.push(stripInline(c));
            const a = aligns[k] ? ` align="${aligns[k]}"` : "";
            return `<td${a}>${renderInline(c)}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");
  const tableHtml = `<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
  return { tableHtml, consumed: idx - start, text: textParts.join(" ") };
}

function parseList(
  lines: string[],
  start: number,
  options: MarkdownOptions
): { listHtml: string; consumed: number; text: string } {
  const first = /^(\s*)([-*+]|\d+[.)])\s+/.exec(lines[start]!)!;
  const baseIndent = first[1]!.length;
  const ordered = /\d/.test(first[2]!);
  const items: string[] = [];
  const texts: string[] = [];
  let i = start;

  while (i < lines.length) {
    const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]!);
    if (!m || m[1]!.length !== baseIndent) {
      // Allow blank line then continued list.
      if (/^\s*$/.test(lines[i]!) && i + 1 < lines.length && new RegExp(`^\\s{${baseIndent}}(?:[-*+]|\\d+[.)])\\s`).test(lines[i + 1]!)) {
        i++;
        continue;
      }
      break;
    }
    // Collect this item's lines (its content + more-indented continuation).
    const itemLines: string[] = [m[3]!];
    i++;
    while (i < lines.length) {
      if (/^\s*$/.test(lines[i]!)) {
        // Peek: continuation only if next non-blank is deeper indented.
        if (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1]!) && (lines[i + 1]!.match(/^\s*/)![0].length > baseIndent)) {
          itemLines.push("");
          i++;
          continue;
        }
        break;
      }
      const indent = lines[i]!.match(/^\s*/)![0].length;
      if (indent > baseIndent) {
        itemLines.push(lines[i]!.slice(baseIndent + 2));
        i++;
      } else break;
    }

    let itemText = itemLines.join("\n");
    // Task list checkbox
    const task = /^\[( |x|X)\]\s+(.*)$/s.exec(itemText);
    let checkbox = "";
    if (task) {
      const checked = task[1]!.toLowerCase() === "x";
      checkbox = `<input type="checkbox" disabled${checked ? " checked" : ""}> `;
      itemText = task[2]!;
    }

    // Nested block content vs simple inline
    if (/\n/.test(itemText) && /^\s*(?:[-*+]|\d+[.)])\s+|^\s*```/.test(itemText.split("\n").slice(1).join("\n"))) {
      const rendered = renderMarkdown(itemText, options);
      texts.push(rendered.text);
      items.push(`<li>${checkbox}${rendered.html}</li>`);
    } else {
      texts.push(stripInline(itemText));
      items.push(`<li>${checkbox}${renderInline(itemText)}</li>`);
    }
  }

  const tag = ordered ? "ol" : "ul";
  const cls = /\[( |x|X)\]/.test(lines[start]!) ? ' class="nd-tasklist"' : "";
  return { listHtml: `<${tag}${cls}>${items.join("")}</${tag}>`, consumed: i - start, text: texts.join(" ") };
}

/** Render inline Markdown (bold, italic, code, links, images) to safe HTML. */
export function renderInline(text: string): string {
  // Extract inline code spans first so their content is never re-parsed.
  const codeSpans: string[] = [];
  let s = text.replace(/(`+)([\s\S]*?)\1/g, (_m, _t, code) => {
    codeSpans.push(`<code>${escapeHtml(code.replace(/^ | $/g, ""))}</code>`);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });

  // Escape everything else up-front, then re-introduce formatting.
  s = escapeHtml(s);

  // Images: ![alt](src "title")
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_m, alt, src, title) => {
    const t = title ? ` title="${escapeAttr(title)}"` : "";
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${t}>`;
  });

  // Links: [text](href "title")
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_m, label, href, title) => {
    const t = title ? ` title="${escapeAttr(title)}"` : "";
    return `<a href="${escapeAttr(href)}"${t}>${label}</a>`;
  });

  // Autolinks: <https://...> already escaped to &lt;...&gt;
  s = s.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_m, url) => `<a href="${escapeAttr(url)}">${url}</a>`);

  // Bold, italic, strikethrough
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(?<![\w*])\*([^*\n]+)\*(?![\w*])/g, "<em>$1</em>");
  s = s.replace(/(?<![\w_])_([^_\n]+)_(?![\w_])/g, "<em>$1</em>");
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // Hard line breaks: two trailing spaces or backslash before newline
  s = s.replace(/(?: {2,}|\\)\n/g, "<br>\n").replace(/\n/g, " ");

  // Restore code spans
  s = s.replace(/\u0000(\d+)\u0000/g, (_m, n) => codeSpans[Number(n)]!);
  return s;
}

/** Strip inline Markdown/HTML for plain-text extraction (search, TOC). */
export function stripInline(text: string): string {
  return text
    .replace(/`+([^`]*)`+/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
