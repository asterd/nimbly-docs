/**
 * Optional plugin: show Archify diagrams inside a page.
 *
 * Archify (https://github.com/tt-a1i/archify) turns a typed JSON description
 * into ONE standalone, interactive HTML file. That file contains a script, so
 * it can never be inlined into Markdown (the sanitizer removes scripts and
 * iframes by design). This plugin is the narrow, explicit exception:
 *
 *   [Architecture map](./diagrams/app.html "archify ratio=1080:640")
 *
 * A normal Markdown link whose title starts with `archify` becomes a framed,
 * sandboxed viewer. Without the plugin the same line is just a working link, so
 * the Markdown stays portable and degrades gracefully.
 *
 * Guard rails (all enforced here, none configurable):
 *  - the host must opt in with `archify-base="./diagrams/"` on <nimbly-docs>;
 *  - only same-origin `.html` files under that folder are ever framed;
 *  - the frame is `sandbox="allow-scripts allow-downloads allow-popups"`, with
 *    NO `allow-same-origin`: the diagram runs in an opaque origin and cannot
 *    read the host page, its storage or its cookies;
 *  - the frame URL is rebuilt from validated parts (embed + theme parameters).
 *
 * This file is a separate build artifact. The core bundle does not import it.
 */
import type { NimblyPlugin } from "../types.js";

export interface ArchifyEmbedSpec {
  /** Fixed frame height in px (used when there is no ratio). */
  height: number;
  /** Width:height of the diagram canvas; the frame follows the column width. */
  ratio: [number, number] | null;
}

const MARKER = /^archify(?:\s+(.*))?$/i;
const DEFAULT_HEIGHT = 560;
const MIN_HEIGHT = 240;
const MAX_HEIGHT = 1600;
const SANDBOX = "allow-scripts allow-downloads allow-popups";

/** Parse a link title. Returns null when the link is not an Archify embed. */
export function parseSpec(title: string | null | undefined): ArchifyEmbedSpec | null {
  const m = MARKER.exec((title ?? "").trim());
  if (!m) return null;
  const spec: ArchifyEmbedSpec = { height: DEFAULT_HEIGHT, ratio: null };
  for (const part of (m[1] ?? "").split(/\s+/)) {
    const h = /^height=(\d{3,4})$/.exec(part);
    if (h) spec.height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Number(h[1])));
    const r = /^ratio=(\d{2,4})[:x](\d{2,4})$/.exec(part);
    if (r) spec.ratio = [Number(r[1]), Number(r[2])];
  }
  return spec;
}

/**
 * Validate a link target. Returns the URL that may be framed, or null.
 * `base` is the host-approved folder (the `archify-base` attribute).
 */
export function resolveEmbedUrl(href: string, base: string, location: { href: string; origin: string }): URL | null {
  let url: URL;
  let folder: URL;
  try {
    url = new URL(href, location.href);
    folder = new URL(base, location.href);
  } catch {
    return null;
  }
  if (url.origin !== location.origin || folder.origin !== location.origin) return null;
  if (url.username || url.password) return null;
  if (!/\.html$/i.test(url.pathname)) return null;
  const prefix = folder.pathname.endsWith("/") ? folder.pathname : folder.pathname + "/";
  if (!url.pathname.startsWith(prefix)) return null;
  return url;
}

/** Build the final frame URL: Archify's own embed mode plus the host's colour scheme. */
export function frameUrl(url: URL, scheme: "light" | "dark"): string {
  const out = new URL(url.href);
  out.search = "";
  out.searchParams.set("embed", "1");
  out.searchParams.set("theme", scheme);
  return out.href;
}

/** Link to the same diagram as a full page (Archify's own toolbar included). */
export function standaloneUrl(url: URL, scheme: "light" | "dark"): string {
  const out = new URL(url.href);
  out.search = "";
  out.searchParams.set("theme", scheme);
  return out.href;
}

const STRINGS = {
  en: { expand: "Expand", collapse: "Close", open: "Open full page", frame: "Interactive diagram", start: "Back to start" },
  it: { expand: "Espandi", collapse: "Chiudi", open: "Apri a pagina intera", frame: "Diagramma interattivo", start: "Torna all'inizio" },
};

function strings(host: Element | null): typeof STRINGS.en {
  const lang = (host?.getAttribute("locale") || document.documentElement.lang || navigator.language || "en").toLowerCase();
  return lang.startsWith("it") ? STRINGS.it : STRINGS.en;
}

function currentHost(): HTMLElement | null {
  return document.querySelector<HTMLElement>("nimbly-docs");
}

function currentScheme(host: Element | null): "light" | "dark" {
  const attr = host?.getAttribute("data-scheme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** CSS is applied through the CSSOM so a strict `style-src 'self'` policy keeps working. */
function style(el: HTMLElement, props: Record<string, string>): void {
  for (const [k, v] of Object.entries(props)) el.style.setProperty(k, v);
}

interface Live { frame: HTMLIFrameElement; url: URL; expanded: boolean; set(address: string): void }
const live = new Set<Live>();
let watching: Element | null = null;

/** Re-point framed diagrams when the reader switches between light and dark. */
function watchScheme(host: HTMLElement): void {
  if (watching === host) return;
  watching = host;
  new MutationObserver(() => {
    const scheme = currentScheme(host);
    for (const item of Array.from(live)) {
      if (!item.frame.isConnected) { live.delete(item); continue; }
      const next = item.expanded ? standaloneUrl(item.url, scheme) : frameUrl(item.url, scheme);
      if (item.frame.src !== next) item.set(next);
    }
  }).observe(host, { attributes: true, attributeFilter: ["data-scheme"] });
}

/** Normal (in-column) and expanded (whole viewport) geometry of one embed. */
function layout(figure: HTMLElement, frame: HTMLElement, spec: ArchifyEmbedSpec, expanded: boolean): void {
  if (expanded) {
    style(figure, {
      position: "fixed", inset: "0", "z-index": "1000", margin: "0", "border-radius": "0", border: "0",
      width: "auto", height: "auto", "max-width": "none",
    });
    style(frame, { flex: "1 1 auto", height: "auto", "min-height": "0", "aspect-ratio": "auto", "max-height": "none" });
    return;
  }
  style(figure, {
    position: "relative", inset: "auto", "z-index": "auto", margin: "1.5rem 0", "border-radius": "var(--dv-radius)",
    border: "1px solid var(--dv-color-border)", width: "auto", height: "auto", "max-width": "none",
  });
  style(frame, spec.ratio
    ? { flex: "none", width: "100%", height: "auto", "aspect-ratio": `${spec.ratio[0]} / ${spec.ratio[1]}`, "min-height": `${MIN_HEIGHT}px`, "max-height": "90vh" }
    : { flex: "none", width: "100%", height: `${spec.height}px`, "aspect-ratio": "auto", "min-height": "0", "max-height": "none" });
}

function build(anchor: HTMLAnchorElement, url: URL, spec: ArchifyEmbedSpec, host: HTMLElement): HTMLElement {
  const t = strings(host);
  const scheme = currentScheme(host);
  const label = anchor.textContent?.trim() || t.frame;

  const figure = document.createElement("figure");
  figure.className = "nd-archify";
  figure.setAttribute("role", "group");
  figure.setAttribute("aria-label", label);
  style(figure, {
    display: "flex", "flex-direction": "column", overflow: "hidden",
    background: "var(--dv-color-surface)", "box-sizing": "border-box",
  });

  const bar = document.createElement("figcaption");
  style(bar, {
    display: "flex", "align-items": "center", gap: ".5rem", padding: ".4rem .75rem", flex: "none",
    "border-bottom": "1px solid var(--dv-color-border)", "font-size": ".8rem", color: "var(--dv-color-muted)",
  });
  const name = document.createElement("span");
  name.textContent = label;
  style(name, { flex: "1", "font-weight": "600", color: "var(--dv-color-text)", "min-width": "0", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" });

  const expand = document.createElement("button");
  expand.type = "button";
  expand.textContent = t.expand;
  expand.setAttribute("aria-expanded", "false");

  // A link inside a diagram navigates the frame (same-origin file, opaque origin: its address is not
  // readable). Every `load` we did not cause is such a navigation; offer a way back to the first diagram.
  const start = document.createElement("button");
  start.type = "button";
  start.textContent = t.start;
  start.hidden = true;

  const open = document.createElement("a");
  open.href = standaloneUrl(url, scheme);
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.textContent = t.open;

  for (const el of [start, expand, open]) {
    style(el, {
      font: "inherit", color: "var(--dv-color-brand-strong)", background: "transparent", border: "0",
      padding: ".15rem .35rem", cursor: "pointer", "text-decoration": "underline", "white-space": "nowrap",
    });
  }
  bar.append(name, start, expand, open);

  const frame = document.createElement("iframe");
  frame.title = label;
  frame.loading = "lazy";
  frame.referrerPolicy = "no-referrer";
  frame.setAttribute("sandbox", SANDBOX);
  frame.setAttribute("allow", "fullscreen");
  frame.setAttribute("allowfullscreen", "");
  let own = 1; // loads caused by this code (the first one is the initial address)
  const item: Live = {
    frame, url, expanded: false,
    set(address) { own++; start.hidden = true; frame.src = address; },
  };
  frame.addEventListener("load", () => { if (own > 0) own--; else start.hidden = false; });
  frame.src = frameUrl(url, scheme);
  style(frame, { display: "block", border: "0", background: "var(--dv-color-bg)" });

  layout(figure, frame, spec, false);

  // Expanded view: the figure covers the viewport and loads Archify's FULL viewer
  // (toolbar, route probe, lens, search, export). Closing restores the clean
  // in-column view. Esc or the button closes it.
  let overflowBefore = "";
  const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setExpanded(false); };
  function setExpanded(on: boolean): void {
    if (expand.getAttribute("aria-expanded") === String(on)) return;
    expand.setAttribute("aria-expanded", String(on));
    expand.textContent = on ? t.collapse : t.expand;
    layout(figure, frame, spec, on);
    item.expanded = on;
    const scheme = currentScheme(host);
    item.set(on ? standaloneUrl(url, scheme) : frameUrl(url, scheme));
    const root = document.documentElement;
    if (on) {
      overflowBefore = root.style.overflow;
      root.style.setProperty("overflow", "hidden");
      document.addEventListener("keydown", onKey);
    } else {
      if (overflowBefore) root.style.setProperty("overflow", overflowBefore); else root.style.removeProperty("overflow");
      document.removeEventListener("keydown", onKey);
    }
    expand.focus();
  }
  expand.addEventListener("click", () => setExpanded(expand.getAttribute("aria-expanded") !== "true"));
  start.addEventListener("click", () => item.set(item.expanded ? standaloneUrl(url, currentScheme(host)) : frameUrl(url, currentScheme(host))));

  figure.append(bar, frame);
  live.add(item);
  return figure;
}

/** Upgrade every Archify link inside `root`. Safe to call repeatedly. */
export function enhance(root: ParentNode): number {
  const host = currentHost();
  const base = host?.getAttribute("archify-base");
  if (!host || !base) return 0; // not opted in: links stay plain links
  let count = 0;
  for (const anchor of Array.from(root.querySelectorAll<HTMLAnchorElement>("a[title]"))) {
    const spec = parseSpec(anchor.getAttribute("title"));
    if (!spec) continue;
    const url = resolveEmbedUrl(anchor.getAttribute("href") ?? "", base, { href: document.baseURI, origin: location.origin });
    if (!url) continue;
    const figure = build(anchor, url, spec, host);
    const parent = anchor.parentElement;
    if (parent?.tagName === "P" && parent.childNodes.length === 1) parent.replaceWith(figure);
    else anchor.replaceWith(figure);
    count++;
  }
  if (count > 0) watchScheme(host);
  return count;
}

export const archifyEmbed: NimblyPlugin = {
  name: "archify-embed",
  onPageRendered(root) {
    enhance(root);
  },
};

// Self-register when loaded next to the viewer. If this module arrives after the
// first page was drawn, upgrade what is already on screen.
if (typeof customElements !== "undefined") {
  void customElements.whenDefined("nimbly-docs").then((El) => {
    (El as unknown as { use(p: NimblyPlugin): void }).use(archifyEmbed);
    const host = currentHost();
    if (host?.shadowRoot) enhance(host.shadowRoot);
  });
}
