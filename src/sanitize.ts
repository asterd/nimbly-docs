/**
 * HTML sanitizer (allow-list based).
 *
 * The Markdown parser never emits raw user HTML, but rendered output can still
 * carry attributes (href/src) that must be validated. This sanitizer parses the
 * HTML with the browser's own parser into an inert document, walks the tree,
 * drops any element/attribute not on the allow-list, and neutralizes dangerous
 * URLs. The result is a safe string reinserted through trusted APIs.
 */

/** Escape the five significant HTML characters. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape only characters significant inside a double-quoted attribute value. */
export function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const ALLOWED_TAGS = new Set([
  "a", "p", "br", "hr", "em", "strong", "del", "s", "sub", "sup", "mark", "small",
  "blockquote", "code", "pre", "kbd", "samp",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "img", "figure", "figcaption", "span", "div", "abbr", "details", "summary",
]);

// Attributes allowed globally and per-tag.
const GLOBAL_ATTRS = new Set(["id", "class", "title", "dir", "lang"]);
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "name"]),
  img: new Set(["src", "alt", "width", "height", "loading", "decoding"]),
  th: new Set(["scope", "colspan", "rowspan", "align"]),
  td: new Set(["colspan", "rowspan", "align"]),
  ol: new Set(["start", "type"]),
  code: new Set(["data-lang"]),
  span: new Set([]),
  details: new Set(["open"]),
};

const URL_ATTRS = new Set(["href", "src"]);
const SAFE_URL = /^(?:https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i;
const DANGEROUS_PROTO = /^\s*(?:javascript|data|vbscript|file|blob):/i;

export interface SanitizeOptions {
  /** Allow http: (not just https:) for image/link sources. Default false → http images blocked. */
  allowHttpImages?: boolean;
  /** Warn (dev only) about images without alt text. */
  warnMissingAlt?: boolean;
}

/**
 * Sanitize an HTML fragment string. Returns a DocumentFragment ready to mount,
 * plus a sanitized HTML string for callers that prefer strings.
 */
export function sanitizeToFragment(html: string, opts: SanitizeOptions = {}): DocumentFragment {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const frag = document.createDocumentFragment();
  const src = doc.body;
  for (const node of Array.from(src.childNodes)) {
    const clean = cleanNode(node, opts);
    if (clean) frag.appendChild(clean);
  }
  return frag;
}

function cleanNode(node: Node, opts: SanitizeOptions): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  // Explicitly hostile elements are dropped whole (including their subtree).
  if (["script", "style", "iframe", "object", "embed", "form", "input", "button", "link", "meta", "svg", "math"].includes(tag)) {
    return null;
  }
  if (!ALLOWED_TAGS.has(tag)) {
    // Unknown tag: unwrap — keep its (sanitized) children, drop the wrapper.
    const frag = document.createDocumentFragment();
    for (const child of Array.from(el.childNodes)) {
      const c = cleanNode(child, opts);
      if (c) frag.appendChild(c);
    }
    return frag;
  }

  const out = document.createElement(tag);
  const allowed = TAG_ATTRS[tag];

  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    // Never allow event handlers or style.
    if (name.startsWith("on") || name === "style") continue;
    if (!(GLOBAL_ATTRS.has(name) || allowed?.has(name))) continue;

    if (URL_ATTRS.has(name)) {
      const safe = sanitizeUrl(value, tag, opts);
      if (safe === null) continue;
      out.setAttribute(name, safe);
      continue;
    }
    out.setAttribute(name, value);
  }

  // Enforce safe defaults per tag.
  if (tag === "a") {
    const href = out.getAttribute("href") || "";
    if (/^https?:/i.test(href)) {
      // External links open safely.
      out.setAttribute("target", "_blank");
      out.setAttribute("rel", "noopener noreferrer");
    }
  }
  if (tag === "img") {
    if (!out.hasAttribute("alt")) {
      out.setAttribute("alt", "");
      if (opts.warnMissingAlt) console.warn("[nimbly-docs] image without alt text:", out.getAttribute("src"));
    }
    out.setAttribute("loading", "lazy");
    out.setAttribute("decoding", "async");
  }

  for (const child of Array.from(el.childNodes)) {
    const c = cleanNode(child, opts);
    if (c) out.appendChild(c);
  }
  return out;
}

function sanitizeUrl(value: string, tag: string, opts: SanitizeOptions): string | null {
  const v = value.trim();
  if (DANGEROUS_PROTO.test(v)) return null;
  if (!SAFE_URL.test(v)) {
    // Allow bare relative paths like "guide/start.md".
    if (/^[\w./#?=&%+-]+$/.test(v)) return v;
    return null;
  }
  if (tag === "img" && /^http:/i.test(v) && !opts.allowHttpImages) return null;
  return v;
}
