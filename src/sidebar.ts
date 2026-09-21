import { SIDEBAR_STATE_PREFIX } from "./constants.js";
import { chevronIcon } from "./icons.js";
import { buildHash } from "./router.js";
import type { ManifestSection, ResolvedManifest } from "./types.js";

export class Sidebar {
  private expanded = new Set<string>();
  private storageKey: string;

  constructor(
    private readonly host: HTMLElement,
    private readonly manifest: ResolvedManifest,
    private readonly onNavigate: () => void
  ) {
    this.storageKey = SIDEBAR_STATE_PREFIX + new URL(manifest.manifestUrl).pathname;
    this.loadState();
  }

  render(activePageId: string): void {
    const frag = document.createDocumentFragment();
    const title = document.createElement("p");
    title.className = "nd-nav-title";
    title.textContent = "Documentation";
    frag.appendChild(title);
    for (const section of this.manifest.sections) frag.appendChild(this.renderSection(section, activePageId));
    this.host.replaceChildren(frag);
  }

  private renderSection(section: ManifestSection, activePageId: string): HTMLElement {
    const group = document.createElement("section");
    group.className = "nd-nav-section";
    const containsActive = this.sectionContains(section, activePageId);
    const expanded = containsActive || this.expanded.has(section.id);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nd-section-toggle";
    btn.setAttribute("aria-expanded", String(expanded));
    btn.setAttribute("aria-controls", `nd-section-${cssSafe(section.id)}`);
    btn.innerHTML = `${chevronIcon()}<span>${escapeHtml(section.title)}</span>`;
    btn.addEventListener("click", () => {
      if (this.expanded.has(section.id)) this.expanded.delete(section.id); else this.expanded.add(section.id);
      this.saveState();
      this.render(activePageId);
    });
    group.appendChild(btn);

    const list = document.createElement("ul");
    list.className = "nd-page-list";
    list.id = `nd-section-${cssSafe(section.id)}`;
    list.hidden = !expanded;
    for (const page of section.pages || []) {
      if (!page.hidden) list.appendChild(this.renderPage(page.id, page.title, page.badge, activePageId));
    }
    for (const sub of section.sections || []) {
      for (const page of sub.pages || []) {
        if (!page.hidden) list.appendChild(this.renderPage(page.id, `${sub.title}: ${page.title}`, page.badge, activePageId));
      }
    }
    group.appendChild(list);
    return group;
  }

  private renderPage(id: string, title: string, badge: string | undefined, active: string): HTMLLIElement {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "nd-page-link";
    a.href = buildHash(id);
    a.textContent = title;
    if (id === active) a.setAttribute("aria-current", "page");
    a.addEventListener("click", () => this.onNavigate());
    if (badge) {
      const b = document.createElement("span");
      b.className = "nd-badge";
      b.textContent = badge;
      a.appendChild(b);
    }
    li.appendChild(a);
    return li;
  }

  private sectionContains(section: ManifestSection, pageId: string): boolean {
    return Boolean(section.pages?.some((p) => p.id === pageId) || section.sections?.some((s) => this.sectionContains(s, pageId)));
  }

  private loadState(): void {
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.storageKey) || "[]") as unknown;
      if (Array.isArray(saved)) for (const id of saved) if (typeof id === "string") this.expanded.add(id);
    } catch { /* unavailable or corrupt session storage */ }
    if (this.expanded.size === 0) {
      for (const id of this.manifest.features.sidebar.defaultExpanded) this.expanded.add(id);
      for (const s of this.manifest.sections) if (!s.collapsed) this.expanded.add(s.id);
    }
  }

  private saveState(): void {
    try { sessionStorage.setItem(this.storageKey, JSON.stringify([...this.expanded])); } catch { /* ignored */ }
  }
}
function cssSafe(id: string): string { return id.replace(/[^a-z0-9_-]/gi, "-"); }
function escapeHtml(v: string): string { return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
