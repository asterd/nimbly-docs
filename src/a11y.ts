/** Focus and announcement helpers shared by the custom element. */
export function announce(live: HTMLElement, message: string): void {
  // Reset first so repeated messages are announced by assistive tech.
  live.textContent = "";
  requestAnimationFrame(() => { live.textContent = message; });
}

export function focusMain(main: HTMLElement): void {
  // Avoid unexpectedly moving focus when users click a sidebar link with a pointer.
  main.focus({ preventScroll: true });
}

export function trapEscape(event: KeyboardEvent, close: () => void): void {
  if (event.key === "Escape") close();
}
