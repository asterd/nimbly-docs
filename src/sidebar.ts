import { SIDEBAR_STATE_PREFIX } from "./constants.js";
import { chevronIcon, externalIcon } from "./icons.js";
import { badgeClass, badgeLabel } from "./badges.js";
import { buildHash } from "./router.js";
import type { ManifestBadge, ManifestSection, ResolvedManifest, ResolvedPage } from "./types.js";

export class Sidebar {
  private expanded = new Set<string>();
  private storageKey: string;

  constructor(
    private readonly host: HTMLElement,
    private readonly manifest: ResolvedManifest,
    private readonly onNavigate: () => void,
    private readonly navTitle = "Documentation"
  ) {
    this.storageKey = SIDEBAR_STATE_PREFIX + new URL(manifest.manifestUrl).pathname;
    this.loadState();
  }

  render(activePageId: string): void {
    const frag = document.createDocumentFragment();
    const title = document.createElement("p");
    title.className = "nd-nav-title";
    title.textContent = this.navTitle;
    frag.appendChild(title);
    for (const section of this.manifest.sections) frag.appendChild(this.renderSection(section, activePageId));
    this.host.replaceChildren(frag);
    // Scroll only the navigation viewport; keep the document and focus in place.
    const active = this.host.querySelector<HTMLElement>('[aria-current="page"]');
    const viewport = this.host;
    if (active && viewport) {
      const item = active.getBoundingClientRect(), bounds = viewport.getBoundingClientRect();
      if (item.top < bounds.top) viewport.scrollTop += item.top - bounds.top - 8;
      else if (item.bottom > bounds.bottom) viewport.scrollTop += item.bottom - bounds.bottom + 8;
    }
  }

  private renderSection(section: ManifestSection, activePageId: string, nested = false): HTMLElement {
    const group = document.createElement("section");
    group.className = nested ? "nd-nav-section nd-nav-subsection" : "nd-nav-section";
    // A section is open if the user expanded it OR it holds the active page.
    const expanded = this.expanded.has(section.id) || this.sectionContains(section, activePageId);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nd-section-toggle";
    btn.setAttribute("aria-expanded", String(expanded));
    btn.setAttribute("aria-controls", `nd-section-${cssSafe(section.id)}`);
    btn.dataset.sectionId = section.id;
    btn.innerHTML = `${chevronIcon()}<span>${escapeHtml(str(section.title))}</span>`;
    if (section.badge) btn.appendChild(badgeElement(section.badge));
    // Toggle only this section in-place. Rebuilding the whole tree on every
    // click was fragile and dropped focus/handlers; here we just flip state.
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      const next = !isOpen;
      if (next) this.expanded.add(section.id); else this.expanded.delete(section.id);
      this.saveState();
      btn.setAttribute("aria-expanded", String(next));
      list.hidden = !next;
    });
    group.appendChild(btn);

    const list = document.createElement("ul");
    list.className = "nd-page-list";
    list.id = `nd-section-${cssSafe(section.id)}`;
    list.hidden = !expanded;
    for (const page of section.pages || []) {
      if (!page.hidden) list.appendChild(this.renderPage(page.id, str(page.title), page.badge, activePageId, (page as unknown as ResolvedPage).link));
    }
    for (const sub of section.sections || []) {
      if (!this.hasVisiblePages(sub)) continue;
      const item = document.createElement("li");
      item.className = "nd-nav-branch";
      item.appendChild(this.renderSection(sub, activePageId, true));
      list.appendChild(item);
    }
    group.appendChild(list);
    return group;
  }

  private renderPage(id: string, title: string, badge: ManifestBadge | undefined, active: string, link?: string): HTMLLIElement {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "nd-page-link";
    a.href = link ?? buildHash(id);
    const label = document.createElement("span");
    label.className = "nd-page-title";
    label.textContent = title;
    a.appendChild(label);
    if (link) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const ext = document.createElement("span");
      ext.className = "nd-page-ext";
      ext.setAttribute("aria-hidden", "true");
      ext.innerHTML = externalIcon();
      a.appendChild(ext);
    }
    if (id === active) a.setAttribute("aria-current", "page");
    a.addEventListener("click", () => this.onNavigate());
    if (badge) a.appendChild(badgeElement(badge));
    li.appendChild(a);
    return li;
  }

  private sectionContains(section: ManifestSection, pageId: string): boolean {
    return Boolean(section.pages?.some((p) => p.id === pageId) || section.sections?.some((s) => this.sectionContains(s, pageId)));
  }

  private hasVisiblePages(section: ManifestSection): boolean {
    return Boolean(section.pages?.some(page => !page.hidden) || section.sections?.some(child => this.hasVisiblePages(child)));
  }

  private loadState(): void {
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.storageKey) || "[]") as unknown;
      if (Array.isArray(saved)) for (const id of saved) if (typeof id === "string") this.expanded.add(id);
    } catch { /* unavailable or corrupt session storage */ }
    if (this.expanded.size === 0) {
      for (const id of this.manifest.features.sidebar.defaultExpanded) this.expanded.add(id);
      const expandDefaults = (sections: ManifestSection[]): void => {
        for (const section of sections) {
          if (!section.collapsed) this.expanded.add(section.id);
          expandDefaults(section.sections || []);
        }
      };
      expandDefaults(this.manifest.sections);
    }
  }

  private saveState(): void {
    try { sessionStorage.setItem(this.storageKey, JSON.stringify([...this.expanded])); } catch { /* ignored */ }
  }
}
/** Resolved manifests carry plain-string titles; coerce for the type checker. */
function str(value: string | Record<string, string>): string {
  return typeof value === "string" ? value : Object.values(value)[0] ?? "";
}
function badgeElement(badge: ManifestBadge): HTMLElement {
  const b = document.createElement("span");
  b.className = `nd-badge nd-tone-${badgeClass(badge)}`;
  b.textContent = badgeLabel(badge);
  b.title = badgeLabel(badge);
  return b;
}
function cssSafe(id: string): string { return id.replace(/[^a-z0-9_-]/gi, "-"); }
function escapeHtml(v: string): string { return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

