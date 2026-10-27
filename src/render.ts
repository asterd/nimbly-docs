/**
 * Content rendering: Markdown → sanitized fragment, with post-processing for
 * relative link rewriting, copy-code buttons, and lazy images.
 *
 * All DOM is prepared in a DocumentFragment and swapped in atomically by the
 * caller to avoid partial states.
 */
import { renderMarkdown } from "./markdown.js";
import { sanitizeToFragment } from "./sanitize.js";
import { buildHash } from "./router.js";
import { copyIcon, checkIcon } from "./icons.js";
import { enhanceComponents, type CalloutLabels } from "./components.js";
import type { ResolvedManifest, ResolvedPage, RenderedDoc, NimblyPlugin } from "./types.js";

export interface RenderContext {
  manifest: ResolvedManifest;
  page: ResolvedPage;
  /** URL the Markdown was actually fetched from; defaults to `page.url`. */
  baseUrl?: string;
  debug: boolean;
  copyCode: boolean;
  plugins: NimblyPlugin[];
  /** Localized default titles for callouts without an authored title. */
  labels: CalloutLabels;
}

export interface RenderResult {
  fragment: DocumentFragment;
  doc: RenderedDoc;
}

/**
 * Turn Markdown source into a mounted-ready fragment.
 * `baseUrl` is the URL of the Markdown file, used to resolve relative links/images.
 */
export function renderContent(markdown: string, ctx: RenderContext): RenderResult {
  const doc = renderMarkdown(markdown, { highlightCode: true });

  let html = doc.html;
  for (const plugin of ctx.plugins) {
    if (plugin.transformHtml) html = plugin.transformHtml(html, ctx.page);
  }

  const fragment = sanitizeToFragment(html, {
    allowHttpImages: false,
    warnMissingAlt: ctx.debug,
  });

  rewriteLinksAndAssets(fragment, ctx);
  if (ctx.copyCode) addCopyButtons(fragment);
  addCodeTitles(fragment);
  enhanceComponents(fragment, ctx.labels);

  for (const plugin of ctx.plugins) {
    if (plugin.onPageRendered) plugin.onPageRendered(fragment, ctx.page);
  }

  return { fragment, doc };
}

/**
 * Rewrite relative links and asset URLs against the Markdown file's URL.
 *  - Links to a known .md page become internal hash routes.
 *  - Other relative links/images resolve to absolute URLs relative to the doc.
 */
function rewriteLinksAndAssets(root: ParentNode, ctx: RenderContext): void {
  const base = ctx.baseUrl ?? ctx.page.url;

  for (const a of Array.from(root.querySelectorAll("a[href]"))) {
    const href = a.getAttribute("href")!;
    if (href.startsWith("#")) {
      // In-page anchor: rewrite to the combined route so deep links survive reloads.
      const anchor = href.slice(1);
      a.setAttribute("href", buildHash(ctx.page.id, anchor));
      continue;
    }
    if (/^https?:|^mailto:|^tel:/i.test(href)) continue; // external, already safe

    // Resolve relative link against the current doc.
    let abs: URL;
    try {
      abs = new URL(href, base);
    } catch {
      continue;
    }
    // If it targets a known page's source, convert to an internal route.
    const target = findPageByUrl(ctx.manifest, abs);
    if (target) {
      const anchor = abs.hash ? abs.hash.slice(1) : null;
      a.setAttribute("href", buildHash(target.id, anchor));
      a.classList.add("nd-internal");
    } else {
      a.setAttribute("href", abs.href);
    }
  }

  for (const img of Array.from(root.querySelectorAll("img[src]"))) {
    const src = img.getAttribute("src")!;
    if (/^https?:/i.test(src)) continue;
    try {
      img.setAttribute("src", new URL(src, base).href);
    } catch {
      /* leave as-is */
    }
  }
}

function findPageByUrl(manifest: ResolvedManifest, url: URL): ResolvedPage | null {
  const target = url.origin + url.pathname;
  for (const page of manifest.pages.values()) {
    for (const candidate of page.candidates) {
      const p = new URL(candidate);
      if (p.origin + p.pathname === target) return page;
    }
  }
  return null;
}

/** Add an accessible copy button to each code block (excluding diagram sources). */
function addCopyButtons(root: ParentNode): void {
  for (const pre of Array.from(root.querySelectorAll("pre"))) {
    if (pre.querySelector('code[data-lang="mermaid"]')) continue;
    const wrapper = document.createElement("div");
    wrapper.className = "nd-codeblock";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nd-copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.setAttribute("data-state", "idle");
    btn.innerHTML = copyIcon();
    // The click handler is attached after mount in element.ts via delegation,
    // but we store the raw text to copy on the element itself.
    const code = pre.querySelector("code");
    btn.setAttribute("data-copy", code?.textContent ?? pre.textContent ?? "");
    const parent = pre.parentNode!;
    parent.insertBefore(wrapper, pre);
    wrapper.appendChild(btn);
    wrapper.appendChild(pre);
  }
}

/**
 * Show a title bar above code blocks authored with ```lang title="…". Blocks
 * inside a code group are labelled by their tab instead.
 */
function addCodeTitles(root: ParentNode): void {
  for (const code of Array.from(root.querySelectorAll<HTMLElement>("pre > code[data-title]"))) {
    const pre = code.parentElement!;
    if (pre.closest(".nd-code-group")) continue;
    const bar = document.createElement("div");
    bar.className = "nd-code-title";
    bar.textContent = code.dataset.title ?? "";
    const host = pre.closest(".nd-codeblock") ?? pre;
    if (host === pre) {
      pre.parentNode!.insertBefore(bar, pre);
    } else {
      host.prepend(bar);
      host.classList.add("nd-codeblock-titled");
    }
  }
}

/** Handle a delegated click on a copy button. Returns true if handled. */
export async function handleCopyClick(target: EventTarget | null): Promise<boolean> {
  const btn = (target as Element | null)?.closest?.(".nd-copy") as HTMLButtonElement | null;
  if (!btn) return false;
  const text = btn.getAttribute("data-copy") ?? "";
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for environments without the async clipboard API.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* ignore */
    }
    ta.remove();
  }
  btn.innerHTML = checkIcon();
  btn.setAttribute("data-state", "copied");
  btn.setAttribute("aria-label", "Copied");
  setTimeout(() => {
    btn.innerHTML = copyIcon();
    btn.setAttribute("data-state", "idle");
    btn.setAttribute("aria-label", "Copy code");
  }, 1600);
  return true;
}
