/**
 * Interactive content components ("MDX-lite").
 *
 * The Markdown parser turns `:::` directives into inert, sanitized markup with
 * `data-*` hints. This module upgrades that markup after sanitization: it adds
 * callout icons and labels, and turns `.nd-tabs` containers into accessible
 * tab widgets (WAI-ARIA tabs pattern). Every element and attribute created
 * here comes from trusted code; authored values only ever reach textContent
 * or attribute values.
 */
import { TABS_STATE_PREFIX } from "./constants.js";
import { bulbIcon, dangerIcon, infoIcon, starIcon, warningIcon } from "./icons.js";
import type { CalloutKind } from "./markdown.js";

export type CalloutLabels = Record<CalloutKind, string>;

const CALLOUT_ICON: Record<CalloutKind, () => string> = {
  note: infoIcon, tip: bulbIcon, important: starIcon, warning: warningIcon, danger: dangerIcon,
};

let counter = 0;

function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage can be unavailable or full */ }
}

/** Upgrade callouts and tab containers inside freshly sanitized content. */
export function enhanceComponents(root: ParentNode, labels: CalloutLabels): void {
  for (const callout of Array.from(root.querySelectorAll<HTMLElement>(".nd-callout"))) {
    const kind = (callout.dataset.kind ?? "note") as CalloutKind;
    const title = callout.querySelector<HTMLElement>(":scope > .nd-callout-title");
    if (!title) continue;
    if (!title.textContent?.trim()) title.textContent = labels[kind] ?? labels.note;
    const icon = document.createElement("span");
    icon.className = "nd-callout-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = (CALLOUT_ICON[kind] ?? infoIcon)();
    title.prepend(icon);
  }

  for (const tabs of Array.from(root.querySelectorAll<HTMLElement>(".nd-tabs"))) {
    const panels = Array.from(tabs.children).filter((c): c is HTMLElement => c.classList.contains("nd-tab-panel"));
    if (panels.length === 0) continue;
    const list = document.createElement("div");
    list.className = "nd-tablist";
    list.setAttribute("role", "tablist");
    for (const panel of panels) {
      const n = counter++;
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "nd-tab";
      tab.id = `nd-tab-${n}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `nd-tabpanel-${n}`);
      tab.textContent = panel.dataset.label ?? "";
      panel.id = `nd-tabpanel-${n}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
      list.appendChild(tab);
    }
    tabs.prepend(list);
    const sync = tabs.dataset.sync;
    const stored = sync ? storageGet(TABS_STATE_PREFIX + sync) : null;
    const initial = stored ? panels.findIndex((p) => p.dataset.label === stored) : -1;
    select(tabs, initial >= 0 ? initial : 0);
  }
}

function tabsOf(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>(":scope > .nd-tablist > .nd-tab"));
}

function select(container: HTMLElement, index: number): void {
  tabsOf(container).forEach((tab, i) => {
    const active = i === index;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    const panel = container.querySelector<HTMLElement>(`#${CSS.escape(tab.getAttribute("aria-controls") ?? "")}`);
    if (panel) panel.hidden = !active;
  });
}

/** Activate a tab and, for synced groups, every tab with the same label in `scope`. */
function activate(tab: HTMLButtonElement, scope: ParentNode): void {
  const container = tab.closest<HTMLElement>(".nd-tabs");
  if (!container) return;
  select(container, tabsOf(container).indexOf(tab));
  const sync = container.dataset.sync;
  const label = tab.textContent ?? "";
  if (!sync) return;
  storageSet(TABS_STATE_PREFIX + sync, label);
  for (const other of Array.from(scope.querySelectorAll<HTMLElement>(".nd-tabs[data-sync]"))) {
    if (other === container || other.dataset.sync !== sync) continue;
    const at = tabsOf(other).findIndex((t) => t.textContent === label);
    if (at >= 0) select(other, at);
  }
}

/** Delegated click handler for tab buttons. Returns true if handled. */
export function handleTabClick(target: EventTarget | null, scope: ParentNode): boolean {
  const tab = (target as Element | null)?.closest?.(".nd-tab") as HTMLButtonElement | null;
  if (!tab) return false;
  activate(tab, scope);
  return true;
}

/** Arrow/Home/End keyboard navigation within a tab list. Returns true if handled. */
export function handleTabKeydown(event: KeyboardEvent, scope: ParentNode): boolean {
  const tab = (event.composedPath()[0] as Element | null)?.closest?.(".nd-tab") as HTMLButtonElement | null;
  if (!tab) return false;
  const container = tab.closest<HTMLElement>(".nd-tabs");
  if (!container) return false;
  const all = tabsOf(container);
  const at = all.indexOf(tab);
  const next =
    event.key === "ArrowRight" ? (at + 1) % all.length :
    event.key === "ArrowLeft" ? (at - 1 + all.length) % all.length :
    event.key === "Home" ? 0 :
    event.key === "End" ? all.length - 1 : -1;
  if (next < 0) return false;
  event.preventDefault();
  activate(all[next]!, scope);
  all[next]!.focus();
  return true;
}
