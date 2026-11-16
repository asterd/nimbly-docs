/**
 * In-page image viewer: a full-screen, touch-first carousel over every image
 * (and diagram) of the current page, instead of navigating away.
 *
 * - tap/click an image or an image link to open it in place;
 * - swipe or ←/→ to move between images, swipe down or Esc to close;
 * - pinch, double-tap, wheel or +/− to zoom, drag to pan.
 *
 * It is a native <dialog> (focus trap, Esc, top layer for free) driven by
 * Pointer Events, so one code path serves mouse, pen and touch.
 */
import { chevronIcon, closeIcon, externalIcon, zoomInIcon, zoomOutIcon } from "./icons.js";
import type { UIStrings } from "./i18n.js";

const IMAGE_PATH = /\.(?:png|jpe?g|gif|webp|avif|svg|bmp)$/i;
const MAX_SCALE = 6;
const TRIGGERS = ".nd-zoomable, .nd-zoom-link";

interface Item { src?: string; svg?: Element; alt: string; trigger: HTMLElement }
interface Point { x: number; y: number }

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/** Mark images and links to images inside sanitized content as viewer triggers. */
export function markZoomables(root: ParentNode, label: string): void {
  for (const a of Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
    try {
      if (IMAGE_PATH.test(new URL(a.getAttribute("href")!, document.baseURI).pathname)) a.classList.add("nd-zoom-link");
    } catch { /* not a URL */ }
  }
  for (const img of Array.from(root.querySelectorAll<HTMLImageElement>("img"))) {
    if (img.closest("a")) continue;
    img.classList.add("nd-zoomable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", img.alt ? `${label}: ${img.alt}` : label);
  }
}

export class Lightbox {
  private dialog: HTMLDialogElement | null = null;
  private stage!: HTMLElement;
  private media: HTMLElement | null = null;
  private items: Item[] = [];
  private index = 0;
  private trigger: HTMLElement | null = null;
  // View state: translation (px, from the centred position) and scale.
  private x = 0;
  private y = 0;
  private scale = 1;
  private pointers = new Map<number, Point>();
  private gesture: { x: number; y: number; tx: number; ty: number; dist: number; scale: number; moved: boolean } | null = null;
  private lastTap = { t: 0, x: 0, y: 0 };

  constructor(private readonly mount: HTMLElement, private readonly s: UIStrings) {}

  destroy(): void { this.dialog?.remove(); this.dialog = null; }

  /** Delegated click: open the viewer for an image trigger in `content`. */
  handleClick(event: MouseEvent, content: HTMLElement): boolean {
    const trigger = (event.target as Element | null)?.closest?.<HTMLElement>(TRIGGERS);
    if (!trigger || !content.contains(trigger)) return false;
    // Modified clicks keep their native meaning (open in a new tab, …).
    if (trigger.tagName === "A" && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return false;
    return this.openFrom(trigger, content, event);
  }

  /** Enter/Space on a focused image opens it. */
  handleKey(event: KeyboardEvent, content: HTMLElement): boolean {
    if (event.key !== "Enter" && event.key !== " ") return false;
    const trigger = (event.composedPath()[0] as Element | null)?.closest?.<HTMLElement>(".nd-zoomable");
    return !!trigger && content.contains(trigger) && this.openFrom(trigger, content, event);
  }

  private openFrom(trigger: HTMLElement, content: HTMLElement, event: Event): boolean {
    const items = this.collect(content);
    const index = items.findIndex((item) => item.trigger === trigger);
    if (index < 0) return false;
    event.preventDefault();
    this.items = items;
    this.trigger = trigger;
    const dialog = this.dialog ?? this.create();
    if (!dialog.open) dialog.showModal();
    this.show(index, 0);
    this.stage.focus({ preventScroll: true });
    return true;
  }

  private collect(content: HTMLElement): Item[] {
    const items: Item[] = [];
    for (const el of Array.from(content.querySelectorAll<HTMLElement>(TRIGGERS))) {
      if (el instanceof HTMLImageElement) {
        // Inline icons and badges are not worth a viewer.
        if (el.complete && el.naturalWidth > 0 && el.naturalWidth < 48 && el.naturalHeight < 48) continue;
        items.push({ src: el.currentSrc || el.src, alt: el.alt, trigger: el });
      } else if (el instanceof HTMLAnchorElement) {
        const img = el.querySelector("img");
        items.push({ src: el.href, alt: img?.alt || el.title || el.textContent?.trim() || "", trigger: el });
      } else {
        const svg = el.querySelector("svg");
        if (svg) items.push({ svg, alt: "", trigger: el });
      }
    }
    return items;
  }

  private create(): HTMLDialogElement {
    const s = this.s;
    const dialog = document.createElement("dialog");
    dialog.className = "nd-lightbox";
    dialog.setAttribute("part", "lightbox");
    dialog.innerHTML = `
      <div class="nd-lb-stage" tabindex="-1"></div>
      <div class="nd-lb-bar">
        <span class="nd-lb-count" aria-live="polite"></span>
        <button type="button" class="nd-lb-btn" data-act="out">${zoomOutIcon()}</button>
        <button type="button" class="nd-lb-btn" data-act="in">${zoomInIcon()}</button>
        <a class="nd-lb-btn nd-lb-original" target="_blank" rel="noopener noreferrer">${externalIcon()}</a>
        <button type="button" class="nd-lb-btn" data-act="close">${closeIcon()}</button>
      </div>
      <button type="button" class="nd-lb-btn nd-lb-nav nd-lb-prev" data-act="prev">${chevronIcon()}</button>
      <button type="button" class="nd-lb-btn nd-lb-nav nd-lb-next" data-act="next">${chevronIcon()}</button>
      <p class="nd-lb-caption"></p>`;
    const labels: Record<string, string> = { out: s.viewerZoomOut, in: s.viewerZoomIn, close: s.viewerClose, prev: s.viewerPrevious, next: s.viewerNext };
    for (const b of Array.from(dialog.querySelectorAll<HTMLElement>("[data-act]"))) {
      b.setAttribute("aria-label", labels[b.dataset.act!]!);
      b.title = labels[b.dataset.act!]!;
    }
    const original = dialog.querySelector<HTMLElement>(".nd-lb-original")!;
    original.setAttribute("aria-label", s.viewerOriginal);
    original.title = s.viewerOriginal;
    this.stage = dialog.querySelector<HTMLElement>(".nd-lb-stage")!;

    dialog.addEventListener("click", (event) => {
      const act = (event.target as Element).closest<HTMLElement>("[data-act]")?.dataset.act;
      if (act === "close") dialog.close();
      else if (act === "prev" || act === "next") this.go(act === "next" ? 1 : -1);
      else if (act === "in" || act === "out") this.zoomTo(this.scale * (act === "in" ? 1.6 : 1 / 1.6), 0, 0, true);
    });
    dialog.addEventListener("keydown", (event) => {
      // Keep keys inside the viewer (the shell maps Escape to the drawer).
      event.stopPropagation();
      if (event.key === "ArrowRight") this.go(1);
      else if (event.key === "ArrowLeft") this.go(-1);
      else if (event.key === "+" || event.key === "=") this.zoomTo(this.scale * 1.6, 0, 0, true);
      else if (event.key === "-") this.zoomTo(this.scale / 1.6, 0, 0, true);
      else if (event.key === "0") this.zoomTo(1, 0, 0, true);
      else return;
      event.preventDefault();
    });
    dialog.addEventListener("close", () => {
      this.stage.replaceChildren();
      this.media = null;
      this.pointers.clear();
      this.trigger?.focus({ preventScroll: true });
    });

    const stage = this.stage;
    stage.addEventListener("pointerdown", (e) => this.down(e));
    stage.addEventListener("pointermove", (e) => this.move(e));
    stage.addEventListener("pointerup", (e) => this.up(e, true));
    stage.addEventListener("pointercancel", (e) => this.up(e, false));
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      const c = this.local(e);
      this.zoomTo(this.scale * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), c.x, c.y);
    }, { passive: false });
    stage.addEventListener("dragstart", (e) => e.preventDefault());

    this.mount.appendChild(dialog);
    this.dialog = dialog;
    return dialog;
  }

  private go(delta: number): void {
    const next = this.index + delta;
    if (next >= 0 && next < this.items.length) this.show(next, delta);
  }

  private show(index: number, direction: number): void {
    const item = this.items[index]!, dialog = this.dialog!;
    this.index = index;
    let media: HTMLElement;
    if (item.svg) {
      media = document.createElement("div");
      media.className = "nd-mermaid nd-lb-svg";
      media.appendChild(item.svg.cloneNode(true));
    } else {
      const img = document.createElement("img");
      img.alt = item.alt;
      img.decoding = "async";
      img.draggable = false;
      this.stage.dataset.loading = "";
      const done = (): void => { if (this.media === img) delete this.stage.dataset.loading; };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      img.src = item.src!;
      media = img;
    }
    media.classList.add("nd-lb-media");
    if (direction) media.classList.add(direction > 0 ? "nd-lb-from-right" : "nd-lb-from-left");
    this.media = media;
    this.stage.replaceChildren(media);
    this.x = this.y = 0;
    this.scale = 1;
    this.apply();

    const many = this.items.length > 1;
    const count = dialog.querySelector<HTMLElement>(".nd-lb-count")!;
    count.textContent = many ? `${index + 1} / ${this.items.length}` : "";
    dialog.querySelector<HTMLElement>(".nd-lb-prev")!.hidden = !many || index === 0;
    dialog.querySelector<HTMLElement>(".nd-lb-next")!.hidden = !many || index === this.items.length - 1;
    const caption = dialog.querySelector<HTMLElement>(".nd-lb-caption")!;
    caption.textContent = item.alt;
    caption.hidden = !item.alt;
    const original = dialog.querySelector<HTMLAnchorElement>(".nd-lb-original")!;
    original.hidden = !item.src;
    if (item.src) original.href = item.src;
    dialog.setAttribute("aria-label", item.alt || this.s.viewerOpen);
    // Warm the neighbours so swiping feels instant.
    for (const n of [this.items[index - 1], this.items[index + 1]]) if (n?.src) new Image().src = n.src;
  }

  // ── Zoom & pan ──────────────────────────────────────────────────────────

  /** Pointer position relative to the stage centre. */
  private local(e: { clientX: number; clientY: number }): Point {
    const r = this.stage.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  }

  /** Zoom to `next`, keeping the stage point (px, py) fixed under the finger/cursor. */
  private zoomTo(next: number, px: number, py: number, animate = false): void {
    const scale = clamp(next, 1, MAX_SCALE);
    this.x = px - (px - this.x) * (scale / this.scale);
    this.y = py - (py - this.y) * (scale / this.scale);
    this.scale = scale;
    this.apply(animate);
  }

  private apply(animate = false, free = false): void {
    const media = this.media;
    if (!media) return;
    if (!free) {
      const mx = Math.max(0, (media.offsetWidth * this.scale - this.stage.clientWidth) / 2);
      const my = Math.max(0, (media.offsetHeight * this.scale - this.stage.clientHeight) / 2);
      this.x = clamp(this.x, -mx, mx);
      this.y = clamp(this.y, -my, my);
    }
    media.style.transition = animate ? "transform .2s ease, opacity .2s ease" : "none";
    media.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(${this.scale})`;
    this.dialog?.toggleAttribute("data-zoomed", this.scale > 1.01);
  }

  private down(e: PointerEvent): void {
    this.stage.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, this.local(e));
    this.startGesture();
  }

  /** (Re)anchor the gesture to the current pointers, so adding/removing a finger never jumps. */
  private startGesture(): void {
    const pts = [...this.pointers.values()];
    if (!pts.length) { this.gesture = null; return; }
    const [a, b] = pts;
    const mid = b ? { x: (a!.x + b.x) / 2, y: (a!.y + b.y) / 2 } : a!;
    this.gesture = {
      x: mid.x, y: mid.y, tx: this.x, ty: this.y, scale: this.scale,
      dist: b ? Math.hypot(a!.x - b.x, a!.y - b.y) : 0, moved: this.gesture?.moved ?? false,
    };
  }

  private move(e: PointerEvent): void {
    const g = this.gesture;
    if (!g || !this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, this.local(e));
    const [a, b] = [...this.pointers.values()];
    if (b) {
      // Pinch: scale by the finger distance, around the moving midpoint.
      const mid = { x: (a!.x + b.x) / 2, y: (a!.y + b.y) / 2 };
      const scale = clamp(g.scale * Math.hypot(a!.x - b.x, a!.y - b.y) / (g.dist || 1), 1, MAX_SCALE);
      this.x = mid.x - (g.x - g.tx) * (scale / g.scale);
      this.y = mid.y - (g.y - g.ty) * (scale / g.scale);
      this.scale = scale;
      g.moved = true;
      this.apply();
      return;
    }
    const dx = a!.x - g.x, dy = a!.y - g.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;
    if (this.scale > 1.01) {
      this.x = g.tx + dx;
      this.y = g.ty + dy;
      this.apply();
    } else if (g.moved && this.media) {
      // Not zoomed: the image follows the finger (swipe to navigate or dismiss).
      const down = Math.abs(dy) > Math.abs(dx) && dy > 0;
      this.x = down ? 0 : dx;
      this.y = down ? dy : 0;
      this.media.style.opacity = down ? String(clamp(1 - dy / 400, 0.3, 1)) : "";
      this.apply(false, true);
    }
  }

  private up(e: PointerEvent, commit: boolean): void {
    if (!this.pointers.delete(e.pointerId)) return;
    const g = this.gesture;
    if (this.pointers.size) { this.startGesture(); return; }
    this.gesture = null;
    if (!g || !commit) return;
    const p = this.local(e);
    if (!g.moved) {
      // Pointer capture retargets events to the stage: hit-test the image box instead.
      const r = this.media?.getBoundingClientRect();
      this.tap(p, !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
      return;
    }
    if (this.scale <= 1.01) {
      const dx = p.x - g.x, dy = p.y - g.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && this.items[this.index + (dx < 0 ? 1 : -1)]) { this.go(dx < 0 ? 1 : -1); return; }
      if (dy > 100 && dy > Math.abs(dx)) { this.dialog?.close(); return; }
      if (this.media) this.media.style.opacity = "";
      this.x = this.y = 0;
      this.apply(true);
    }
  }

  /** Double-tap toggles zoom at the tapped point; a tap on the backdrop closes. */
  private tap(p: Point, onMedia: boolean): void {
    const now = performance.now();
    if (onMedia && now - this.lastTap.t < 320 && Math.hypot(p.x - this.lastTap.x, p.y - this.lastTap.y) < 30) {
      this.lastTap.t = 0;
      if (this.scale > 1.01) { this.x = this.y = 0; this.scale = 1; this.apply(true); }
      else this.zoomTo(2.5, p.x, p.y, true);
      return;
    }
    this.lastTap = { t: now, x: p.x, y: p.y };
    if (!onMedia && this.scale <= 1.01) this.dialog?.close();
  }
}
