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
 * hard line breaks, GitHub alerts (`> [!NOTE]`) and container directives
 * (`:::tip`, `:::tabs`, `:::code-group`, …).
 *
 * Directives are the "MDX-lite" layer: declarative blocks that only ever emit
 * allow-listed tags plus `data-*` hints. Interactivity (tab buttons, ARIA,
 * icons) is added afterwards by trusted code in components.ts, so authored
 * content can never carry markup or script.
 */
import { escapeHtml, escapeAttr } from "./sanitize.js";
import { highlight, normalizeLang } from "./highlight.js";
import type { RenderedDoc, TocEntry } from "./types.js";

export interface MarkdownOptions {
  /** Called to convert a heading text to a slug id. */
  slug?: (text: string, used: Set<string>) => string;
  /** Highlight fenced code blocks. Default true. */
  highlightCode?: boolean;
  /** @internal Heading ids already used, shared with nested renders so ids stay unique. */
  usedIds?: Set<string>;
}

/** Callout kinds produced by `:::<kind>` directives and GitHub alerts. */
export const CALLOUT_KINDS = ["note", "tip", "important", "warning", "danger"] as const;
export type CalloutKind = (typeof CALLOUT_KINDS)[number];

const CALLOUT_ALIASES: Record<string, CalloutKind> = {
  note: "note", info: "note", tip: "tip", success: "tip", important: "important",
  warning: "warning", caution: "warning", danger: "danger", error: "danger",
};

/** Readable tab labels for untitled blocks in a code group. */
const LANG_LABELS: Record<string, string> = {
  js: "JavaScript", javascript: "JavaScript", ts: "TypeScript", typescript: "TypeScript", py: "Python", python: "Python",
  sh: "Shell", bash: "Bash", zsh: "Zsh", powershell: "PowerShell", ps1: "PowerShell", java: "Java", kotlin: "Kotlin",
  go: "Go", rust: "Rust", rs: "Rust", cs: "C#", csharp: "C#", cpp: "C++", c: "C", php: "PHP", rb: "Ruby", ruby: "Ruby",
  swift: "Swift", json: "JSON", yaml: "YAML", yml: "YAML", toml: "TOML", html: "HTML", css: "CSS", sql: "SQL", xml: "XML",
};

const FENCE = /^(\s*)(`{3,}|~{3,})\s*([\w+#-]*)\s*([^`]*?)\s*$/;
const DIRECTIVE_OPEN = /^\s*:{3,}\s*([a-z][a-z0-9-]*)\s*(.*)$/i;
const DIRECTIVE_CLOSE = /^\s*:{3,}\s*$/;

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
  const used = options.usedIds ?? new Set<string>();
  const nested: MarkdownOptions = { ...options, usedIds: used };
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

    // Fenced code block ``` or ~~~ (optionally with a title: ```js title="app.js" or ```js [app.js])
    if (FENCE.test(line)) {
      const block = parseFence(lines, i, highlightCode);
      pushText(block.code);
      html.push(block.html);
      i += block.consumed;
      continue;
    }

    // Container directive  :::name [Title] {attrs}  …  :::
    const directive = DIRECTIVE_OPEN.exec(line);
    if (directive) {
      const { body, consumed } = collectDirective(lines, i);
      const rendered = renderDirective(directive[1]!.toLowerCase(), directive[2] ?? "", body, nested, highlightCode);
      if (rendered.text) textParts.push(rendered.text);
      html.push(rendered.html);
      i += consumed;
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
      // GitHub alert syntax: > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
      const alert = /^\[!(note|tip|important|warning|caution)\]\s*(.*)$/i.exec(quote[0] ?? "");
      if (alert) {
        quote[0] = alert[2]!;
        const inner = renderMarkdown(quote.join("\n"), nested);
        textParts.push(inner.text);
        html.push(calloutHtml(CALLOUT_ALIASES[alert[1]!.toLowerCase()]!, "", inner.html));
        continue;
      }
      const inner = renderMarkdown(quote.join("\n"), nested);
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
      const { listHtml, consumed, text } = parseList(lines, i, nested);
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
      !/^\s*:{3,}/.test(lines[i]!) &&
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

interface FenceBlock {
  html: string;
  code: string;
  /** Author title (`title="…"` or `[…]`), else the language label. */
  label: string;
  consumed: number;
}

/** Parse a fenced code block starting at `start` into highlighted, escaped HTML. */
function parseFence(lines: string[], start: number, highlightCode: boolean): FenceBlock {
  const fence = FENCE.exec(lines[start]!)!;
  const marker = fence[2]!;
  const rawLang = (fence[3] || "").toLowerCase().trim();
  const lang = normalizeLang(fence[3]);
  const meta = fence[4] || "";
  const titleMatch = /title\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(meta) ?? /^\[([^\]]+)\]/.exec(meta);
  const title = (titleMatch?.[1] ?? titleMatch?.[2] ?? "").trim();
  const close = new RegExp(`^\\s*${marker[0]}{${marker.length},}\\s*$`);
  const body: string[] = [];
  let i = start + 1;
  while (i < lines.length && !close.test(lines[i]!)) {
    body.push(lines[i]!);
    i++;
  }
  i++; // consume closing fence
  const code = body.join("\n");
  // Diagram blocks (e.g. mermaid) are kept verbatim and never highlighted;
  // their language label is preserved so downstream renderers can find them.
  const isDiagram = rawLang === "mermaid";
  const inner = highlightCode && !isDiagram ? highlight(code, lang) : escapeHtml(code);
  const labelLang = lang || (rawLang ? rawLang : "");
  const langAttr = labelLang ? ` data-lang="${escapeAttr(labelLang)}"` : "";
  const titleAttr = title ? ` data-title="${escapeAttr(title)}"` : "";
  return {
    html: `<pre><code${langAttr}${titleAttr}>${inner}\n</code></pre>`,
    code,
    label: title || LANG_LABELS[rawLang] || rawLang,
    consumed: Math.min(i, lines.length) - start,
  };
}

/**
 * Collect a directive body up to its matching bare `:::` line. Nesting is
 * tracked by depth (so colon counts do not matter) and fenced code is skipped,
 * so a `:::` inside a code sample never closes the container.
 */
function collectDirective(lines: string[], start: number): { body: string[]; consumed: number } {
  const body: string[] = [];
  let depth = 0;
  let fence: RegExp | null = null;
  let i = start + 1;
  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (fence) {
      if (fence.test(line)) fence = null;
    } else if (FENCE.test(line)) {
      const marker = FENCE.exec(line)![2]!;
      fence = new RegExp(`^\\s*${marker[0]}{${marker.length},}\\s*$`);
    } else if (DIRECTIVE_OPEN.test(line)) {
      depth++;
    } else if (DIRECTIVE_CLOSE.test(line)) {
      if (depth === 0) return { body, consumed: i + 1 - start };
      depth--;
    }
    body.push(line);
  }
  return { body, consumed: i - start };
}

/** Split a directive's opening-line argument into a title and `{key=value}` attributes. */
function parseDirectiveArgs(raw: string): { title: string; attrs: Record<string, string> } {
  const attrs: Record<string, string> = {};
  let rest = raw.trim();
  const braces = /\{([^}]*)\}\s*$/.exec(rest);
  if (braces) {
    rest = rest.slice(0, braces.index).trim();
    const pair = /([a-z][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/gi;
    let m: RegExpExecArray | null;
    while ((m = pair.exec(braces[1]!))) attrs[m[1]!.toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  const bracket = /^\[([^\]]*)\]/.exec(rest);
  const title = (bracket ? bracket[1]! : rest).trim();
  return { title, attrs };
}

function calloutHtml(kind: CalloutKind, title: string, inner: string): string {
  // An empty title is filled with a localized label (Note, Tip, …) after sanitization.
  return `<div class="nd-callout" data-kind="${kind}"><p class="nd-callout-title">${renderInline(title)}</p>${inner}</div>`;
}

/** Render one container directive. Unknown names degrade to their plain content. */
function renderDirective(
  name: string,
  rawArgs: string,
  body: string[],
  options: MarkdownOptions,
  highlightCode: boolean
): { html: string; text: string } {
  const { title, attrs } = parseDirectiveArgs(rawArgs);
  const syncAttr = (fallback: string) => {
    const key = attrs.sync ?? fallback;
    return key && key !== "none" ? ` data-sync="${escapeAttr(key)}"` : "";
  };

  if (name === "code-group") {
    const panels: string[] = [];
    const texts: string[] = [];
    for (let i = 0; i < body.length; ) {
      if (!FENCE.test(body[i]!)) { i++; continue; }
      const block = parseFence(body, i, highlightCode);
      texts.push(block.code);
      const label = block.label || `${panels.length + 1}`;
      panels.push(`<div class="nd-tab-panel" data-label="${escapeAttr(label)}">${block.html}</div>`);
      i += block.consumed;
    }
    return { html: `<div class="nd-tabs nd-code-group"${syncAttr("code")}>${panels.join("")}</div>`, text: texts.join(" ") };
  }

  const inner = renderMarkdown(body.join("\n"), options);
  const text = [stripInline(title), inner.text].filter(Boolean).join(" ");
  const kind = CALLOUT_ALIASES[name];
  if (kind) return { html: calloutHtml(kind, title, inner.html), text };

  switch (name) {
    case "details":
      return {
        html: `<details class="nd-details"${"open" in attrs ? " open" : ""}><summary>${renderInline(title || "Details")}</summary>${inner.html}</details>`,
        text,
      };
    case "tabs":
      return { html: `<div class="nd-tabs"${syncAttr("")}>${inner.html}</div>`, text };
    case "tab":
      return { html: `<div class="nd-tab-panel" data-label="${escapeAttr(stripInline(title) || "Tab")}">${inner.html}</div>`, text };
    case "steps":
      return { html: `<div class="nd-steps">${inner.html}</div>`, text };
    case "cards":
      return { html: `<div class="nd-cards">${inner.html}</div>`, text };
    case "card": {
      const label = renderInline(title);
      const heading = attrs.href ? `<a href="${escapeAttr(attrs.href)}">${label}</a>` : label;
      return { html: `<div class="nd-card"><p class="nd-card-title">${heading}</p>${inner.html}</div>`, text };
    }
    default:
      return { html: `<div>${inner.html}</div>`, text };
  }
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
