/**
 * Declarative page downloads and provenance. Only normalized manifest data is
 * used; no host-specific selectors, external scripts or runtime backend.
 */
import { badgeClass, badgeLabel } from "./badges.js";
import { chevronIcon, downloadIcon, externalIcon, historyIcon } from "./icons.js";
import type { UIStrings } from "./i18n.js";
import type { ManifestBadge, ResolvedAttachment, ResolvedPage } from "./types.js";

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

function badge(value: ManifestBadge): HTMLElement {
  const node = element("span", badgeLabel(value), "nd-badge nd-tone-" + badgeClass(value));
  node.title = badgeLabel(value);
  return node;
}

function size(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KiB";
  return (bytes / 1024 / 1024).toFixed(1) + " MiB";
}

function filename(url: string): string {
  const name = new URL(url).pathname.split("/").pop() || "document";
  try { return decodeURIComponent(name); } catch { return name; }
}

/** Export the loaded source, not rendered HTML, with portable provenance. */
export function markdownDownload(page: ResolvedPage, markdown: string): string {
  const metadata = {
    title: page.title, page: page.id, branch: page.revision?.branch,
    commit: page.revision?.commit, updated_at: page.revision?.updatedAt,
  };
  const lines = Object.entries(metadata).filter(([, value]) => value !== undefined)
    .map(([key, value]) => key + ": " + JSON.stringify(value));
  return "---\n" + lines.join("\n") + "\n---\n\n" + markdown;
}

let groupSeq = 0;

function icon(markup: string, cls: string): HTMLElement {
  const node = element("span", undefined, cls);
  node.setAttribute("aria-hidden", "true");
  node.innerHTML = markup;
  return node;
}

/** Short, uppercase format label: "MD", "SQL", "PDF"… (max 4 chars). */
function formatLabel(file: ResolvedAttachment): string {
  if (file.mediaType === "text/markdown") return "MD";
  const ext = filename(file.url).split(".").pop() || "";
  return /^[a-z0-9]{1,5}$/i.test(ext) && ext !== filename(file.url) ? ext.slice(0, 4).toUpperCase() : "FILE";
}

/**
 * A toggle button that controls a panel rendered below the toolbar row. Unlike
 * <details>, the controls stay put when a panel opens, so the row never reflows.
 */
function toggle(label: string, glyph: string, panel: HTMLElement, count?: number): HTMLButtonElement {
  const button = element("button", undefined, "nd-tool-toggle");
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", panel.id);
  button.append(icon(glyph, "nd-tool-icon"), element("span", label, "nd-tool-label"));
  if (count !== undefined) button.appendChild(element("span", String(count), "nd-tool-count"));
  button.appendChild(icon(chevronIcon(), "nd-tool-caret"));
  return button;
}

export function renderPageTools(page: ResolvedPage, sourceUrl: string, labels: UIStrings, sourceDownload: boolean, markdown: string): HTMLElement | null {
  const revision = page.revision;
  const files = [...page.attachments];
  const sourceText = sourceDownload ? markdownDownload(page, markdown) : "";
  const currentSource: ResolvedAttachment | null = sourceDownload ? {
    label: labels.downloadSource, url: sourceUrl, group: labels.downloadPage,
    mediaType: "text/markdown", download: page.id.replace(/\//g, "-") + ".md",
    bytes: new TextEncoder().encode(sourceText).length,
  } : null;
  if (currentSource) files.unshift(currentSource);
  if (!revision && files.length === 0) return null;

  const tools = element("aside", undefined, "nd-page-tools");
  tools.setAttribute("part", "page-tools");
  tools.setAttribute("aria-label", labels.pageTools);
  const bar = element("div", undefined, "nd-page-tools-bar");
  const status = element("div", undefined, "nd-page-status");
  const actions = element("div", undefined, "nd-page-actions");
  bar.append(status, actions);
  tools.appendChild(bar);
  const pairs: Array<[HTMLButtonElement, HTMLElement]> = [];

  if (revision) {
    if (revision.branch) status.appendChild(badge({ label: revision.branch, tone: revision.branchTone ?? "neutral" }));
    if (revision.status) status.appendChild(badge(revision.status));
    const rows: Array<[string, string | undefined, boolean]> = [
      [labels.revisionDate, revision.updatedAt?.slice(0, 10), false],
      [labels.revisionBranch, revision.branch, true],
      [labels.revisionCommit, revision.commit, true],
      [labels.revisionSource, revision.source, true],
    ];
    if (rows.some(([, value]) => value)) {
      const panel = element("div", undefined, "nd-tool-panel nd-page-revision");
      panel.id = "nd-revision-panel";
      const list = element("dl");
      for (const [label, value, mono] of rows) {
        if (!value) continue;
        list.append(element("dt", label), element("dd", value, mono ? "nd-mono" : undefined));
      }
      panel.appendChild(list);
      pairs.push([toggle(labels.revision, historyIcon(), panel), panel]);
    }
  }

  if (files.length) {
    const panel = element("div", undefined, "nd-tool-panel nd-download-panel");
    panel.id = "nd-download-panel";
    panel.setAttribute("part", "downloads");
    const groups = new Map<string, ResolvedAttachment[]>();
    for (const file of files) {
      const group = file.group || labels.downloadFiles;
      groups.set(group, [...(groups.get(group) || []), file]);
    }
    for (const [group, entries] of groups) {
      const section = element("section", undefined, "nd-download-group");
      const title = element("div", group, "nd-download-group-title");
      title.id = "nd-dl-group-" + (++groupSeq);
      section.setAttribute("aria-labelledby", title.id);
      const list = element("ul", undefined, "nd-download-list");
      for (const file of entries) {
        const item = element("li", undefined, "nd-download-item");
        const link = element("a", undefined, "nd-download-link");
        link.href = file.url;
        link.setAttribute("part", "download-link");
        const external = new URL(file.url).origin !== window.location.origin;
        const saves = file.download !== false;
        if (saves) link.download = typeof file.download === "string" ? file.download : filename(file.url);
        if (file === currentSource) link.addEventListener("click", (event) => {
          event.preventDefault();
          const url = URL.createObjectURL(new Blob([sourceText], { type: "text/markdown;charset=utf-8" }));
          const download = element("a");
          download.href = url; download.download = link.download;
          document.body.appendChild(download); download.click(); download.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
        if (external) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
        const body = element("span", undefined, "nd-download-body");
        body.appendChild(element("span", file.label, "nd-download-label"));
        if (file.description) body.appendChild(element("span", file.description, "nd-download-description"));
        const meta = element("span", file.bytes !== undefined ? size(file.bytes) : "", "nd-download-meta");
        link.append(element("span", formatLabel(file), "nd-download-format"), body, meta,
          icon(saves && !external ? downloadIcon() : externalIcon(), "nd-download-action"));
        item.appendChild(link); list.appendChild(item);
      }
      section.append(title, list); panel.appendChild(section);
    }
    pairs.push([toggle(labels.downloads, downloadIcon(), panel, files.length), panel]);
  }

  // One panel open at a time keeps the article from being pushed far down.
  const setOpen = (target: HTMLButtonElement | null): void => {
    for (const [button, panel] of pairs) {
      const open = button === target;
      button.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    }
    tools.classList.toggle("nd-tools-open", target !== null);
  };
  for (const [button, panel] of pairs) {
    actions.appendChild(button);
    panel.hidden = true;
    tools.appendChild(panel);
    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") === "true" ? null : button));
    panel.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(null);
      button.focus();
    });
  }
  if (!status.childNodes.length && !actions.childNodes.length) return null;
  return tools;
}
