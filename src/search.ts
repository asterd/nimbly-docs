import type { ResolvedManifest, SearchDoc, SearchHit } from "./types.js";
import { closeIcon } from "./icons.js";

/**
 * Local search.
 *
 * Titles and descriptions are searchable immediately; page bodies join the index
 * progressively, during idle time, as pages are visited. Nothing is sent to a
 * server and no third-party service is contacted.
 */
export class SearchController {
  private docs = new Map<string, SearchDoc>();
  private dialog: HTMLDialogElement | null = null;
  private input: HTMLElement | null = null;
  private sentinel: HTMLElement | null = null;
  private query = "";
  private results: HTMLElement | null = null;
  private hits: SearchHit[] = [];
  private active = -1;

  constructor(
    manifest: ResolvedManifest,
    private readonly mount: HTMLElement,
    private readonly onNavigate: (id: string) => void
  ) {
    for (const page of manifest.order) {
      this.docs.set(page.id, {
        id: page.id,
        title: page.title,
        sectionPath: page.sectionPath,
        headings: [],
        body: page.description || "",
      });
    }
  }

  /** Add a rendered page to the full-text index without blocking interaction. */
  index(id: string, body: string, headings: string[]): void {
    const doc = this.docs.get(id);
    if (!doc) return;
    const work = (): void => {
      doc.body = body.slice(0, 200_000);
      doc.headings = headings;
    };
    if ("requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback(cb: () => void): number }).requestIdleCallback(work);
    } else {
      setTimeout(work, 0);
    }
  }

  open(query = ""): void {
    const dialog = this.dialog ?? this.createDialog();
    if (!dialog.open) dialog.showModal();
    this.setQuery(query);
    this.update();
    // The sentinel owns programmatic focus so no visible control gets a native
    // browser focus ring when the dialog opens.
    requestAnimationFrame(() => {
      if (this.sentinel) focusWithoutVisibleRing(this.sentinel);
    });
  }

  close(): void {
    if (this.dialog?.open) this.dialog.close();
  }

  isOpen(): boolean { return this.dialog?.open === true; }

  destroy(): void {
    this.dialog?.remove();
    this.dialog = null;
  }

  private createDialog(): HTMLDialogElement {
    const dialog = document.createElement("dialog");
    dialog.className = "nd-search-dialog";
    dialog.tabIndex = -1;
    dialog.setAttribute("aria-label", "Search documentation");
    dialog.innerHTML = `
      <div class="nd-search-panel">
        <div class="nd-focus-sentinel" tabindex="-1" aria-label="Search documentation"></div>
        <div class="nd-search-field">
          <div class="nd-search-input" aria-hidden="true">
            <span class="nd-search-placeholder">Search documentation…</span>
            <span class="nd-search-value" aria-live="polite"></span>
          </div>
          <button class="nd-search-close" type="button" tabindex="-1" aria-label="Close search">${closeIcon()}</button>
        </div>
        <div class="nd-search-results" id="nd-search-results" role="listbox" aria-label="Search results"></div>
        <div class="nd-search-hint">
          <span><kbd class="nd-kbd">↑</kbd><kbd class="nd-kbd">↓</kbd> to navigate</span>
          <span><kbd class="nd-kbd">Enter</kbd> to open</span>
          <span><kbd class="nd-kbd">Esc</kbd> to close</span>
        </div>
      </div>
    `;

    this.sentinel = dialog.querySelector<HTMLElement>(".nd-focus-sentinel")!;
    this.input = dialog.querySelector<HTMLElement>(".nd-search-input")!;
    this.results = dialog.querySelector<HTMLElement>(".nd-search-results")!;

    // The visual query surface never receives native focus: the dialog captures
    // text input so browser focus rings cannot appear around the field.
    this.input.addEventListener("mousedown", (event) => {
      event.preventDefault();
      focusWithoutVisibleRing(dialog);
    });
    dialog.querySelector(".nd-search-close")!.addEventListener("click", () => this.close());

    // A click that lands on the dialog itself is a backdrop click: dismiss.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) this.close();
    });
    dialog.addEventListener("close", () => {
      this.active = -1;
    });
    // Keep Escape inside the dialog so it cannot reach the mobile drawer, and
    // support immediate typing while the dialog itself owns programmatic focus.
    dialog.addEventListener("keydown", (event) => this.onDialogKeydown(event));
    dialog.addEventListener("paste", (event) => {
      const text = event.clipboardData?.getData("text");
      if (!text) return;
      event.preventDefault();
      this.setQuery(this.query + text);
      this.active = -1;
      this.update();
    });

    this.mount.appendChild(dialog);
    this.dialog = dialog;
    return dialog;
  }

  private onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      this.setQuery(this.query.slice(0, -1));
      this.active = -1;
      this.update();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter") {
      this.onKeydown(event);
      return;
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.setQuery(this.query + event.key);
      this.active = -1;
      this.update();
    }
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.move(-1);
    } else if (event.key === "Enter") {
      const hit = this.hits[this.active] ?? this.hits[0];
      if (hit) {
        event.preventDefault();
        this.choose(hit.id);
      }
    }
  }

  private move(delta: number): void {
    if (this.hits.length === 0) return;
    const next = this.active + delta;
    this.active = next < 0 ? this.hits.length - 1 : next >= this.hits.length ? 0 : next;
    this.paintSelection();
  }

  /** Recompute hits for the current query and repaint the list. */
  private update(): void {
    this.hits = this.find(this.query, 30);
    this.render();
  }

  private setQuery(value: string): void {
    this.query = value;
    const field = this.input;
    if (!field) return;
    const placeholder = field.querySelector<HTMLElement>(".nd-search-placeholder");
    const output = field.querySelector<HTMLElement>(".nd-search-value");
    if (placeholder) placeholder.hidden = value.length > 0;
    if (output) output.textContent = value;
  }

  private render(): void {
    const results = this.results;
    if (!results) return;

    if (this.hits.length === 0) {
      const empty = document.createElement("p");
      empty.className = "nd-search-empty";
      empty.textContent = this.query.trim()
        ? "No pages match that search."
        : "Start typing to search the documentation.";
      results.replaceChildren(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    this.hits.forEach((hit, index) => {
      const item = document.createElement("a");
      item.className = "nd-search-result";
      item.id = `nd-search-hit-${index}`;
      item.href = `#/${encodeURI(hit.id)}`;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(index === this.active));

      const title = document.createElement("span");
      title.className = "nd-search-result-title";
      title.textContent = hit.title;

      const path = document.createElement("span");
      path.className = "nd-search-result-path";
      path.textContent = hit.sectionPath.join(" / ");
      item.append(title, path);

      if (hit.snippet) {
        const snippet = document.createElement("span");
        snippet.className = "nd-search-result-snippet";
        snippet.textContent = hit.snippet;
        item.appendChild(snippet);
      }

      item.addEventListener("click", (event) => {
        event.preventDefault();
        this.choose(hit.id);
      });
      frag.appendChild(item);
    });
    results.replaceChildren(frag);
    this.paintSelection();
  }

  private paintSelection(): void {
    const results = this.results;
    if (!results) return;
    const items = Array.from(results.querySelectorAll<HTMLElement>(".nd-search-result"));
    items.forEach((item, index) => item.setAttribute("aria-selected", String(index === this.active)));
    const current = items[this.active];
    if (current) {
      current.scrollIntoView({ block: "nearest" });
      this.input?.setAttribute("aria-activedescendant", current.id);
    } else {
      this.input?.removeAttribute("aria-activedescendant");
    }
  }

  private choose(id: string): void {
    this.close();
    this.onNavigate(id);
  }

  private find(query: string, limit: number): SearchHit[] {
    const words = normalize(query);
    if (words.length === 0) return [];
    const hits: SearchHit[] = [];

    for (const doc of this.docs.values()) {
      const title = doc.title.toLocaleLowerCase();
      const headings = doc.headings.join(" ").toLocaleLowerCase();
      const body = doc.body.toLocaleLowerCase();
      let score = 0;
      let matched = true;

      for (const word of words) {
        const inTitle = title.indexOf(word);
        const inHeading = headings.indexOf(word);
        const inBody = body.indexOf(word);
        if (inTitle < 0 && inHeading < 0 && inBody < 0) {
          matched = false;
          break;
        }
        if (inTitle >= 0) score += 24 - Math.min(inTitle, 10) / 10;
        if (inHeading >= 0) score += 9;
        if (inBody >= 0) score += 2;
      }
      if (!matched) continue;

      const at = words.map((w) => body.indexOf(w)).find((v) => v >= 0) ?? -1;
      hits.push({
        id: doc.id,
        title: doc.title,
        sectionPath: doc.sectionPath,
        snippet: at >= 0 ? makeSnippet(doc.body, at, words[0]!) : doc.headings[0] || "",
        score,
      });
    }
    return hits
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, limit);
  }
}

function normalize(value: string): string[] {
  return value.toLocaleLowerCase().trim().split(/\s+/).filter((word) => word.length >= 2).slice(0, 8);
}

function makeSnippet(text: string, index: number, word: string): string {
  const start = Math.max(0, index - 48);
  const end = Math.min(text.length, index + word.length + 92);
  const body = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${body}${end < text.length ? "…" : ""}`;
}

function focusWithoutVisibleRing(element: HTMLElement): void {
  type FocusWithVisibility = FocusOptions & { focusVisible?: boolean };
  try {
    (element as HTMLElement & { focus(options?: FocusWithVisibility): void }).focus({ focusVisible: false });
  } catch {
    element.focus({ preventScroll: true });
  }
}
