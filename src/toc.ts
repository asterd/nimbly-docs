import { buildHash } from "./router.js";
import type { TocEntry } from "./types.js";

export class Toc {
  private observer: IntersectionObserver | null = null;

  constructor(private readonly host: HTMLElement, private readonly onNavigate: () => void) {}

  render(pageId: string, entries: TocEntry[]): void {
    this.disconnect();
    if (entries.length === 0) { this.host.hidden = true; return; }
    const frag = document.createDocumentFragment();
    const title = document.createElement("p");
    title.className = "nd-toc-title";
    title.textContent = "On this page";
    frag.appendChild(title);
    for (const entry of entries) {
      const a = document.createElement("a");
      a.className = `l${entry.level}`;
      a.href = buildHash(pageId, entry.id);
      a.textContent = entry.text;
      a.dataset.tocFor = entry.id;
      a.addEventListener("click", () => this.onNavigate());
      frag.appendChild(a);
    }
    this.host.replaceChildren(frag);
    this.host.hidden = false;
    this.observe(entries);
  }

  disconnect(): void { this.observer?.disconnect(); this.observer = null; }

  private observe(entries: TocEntry[]): void {
    if (!("IntersectionObserver" in window)) return;
    this.observer = new IntersectionObserver((changes) => {
      const visible = changes.filter((c) => c.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      this.host.querySelectorAll("a[aria-current]").forEach((a) => a.removeAttribute("aria-current"));
      this.host.querySelector<HTMLAnchorElement>(`a[data-toc-for="${CSS.escape(visible.target.id)}"]`)?.setAttribute("aria-current", "true");
    }, { rootMargin: "-10% 0px -75% 0px", threshold: 0 });
    for (const entry of entries) {
      const root = this.host.getRootNode();
      const heading = root instanceof ShadowRoot ? root.querySelector<HTMLElement>(`#${CSS.escape(entry.id)}`) : null;
      if (heading) this.observer.observe(heading);
    }
  }
}
