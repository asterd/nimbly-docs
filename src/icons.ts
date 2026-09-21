/**
 * A tiny set of inline SVG icons. All are trusted, static strings authored here
 * (never derived from user content), so they are safe to assign via innerHTML.
 */
const svg = (path: string, extra = ""): string =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra ? " " + extra : ""}>${path}</svg>`;

export const searchIcon = (): string => svg('<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>');
export const menuIcon = (): string => svg('<path d="M3 6h18M3 12h18M3 18h18"></path>');
export const closeIcon = (): string => svg('<path d="M18 6 6 18M6 6l12 12"></path>');
export const sunIcon = (): string =>
  svg('<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>');
export const moonIcon = (): string => svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>');
/** Appearance "auto": a dial that reads as system-driven contrast. */
export const autoIcon = (): string =>
  svg('<circle cx="12" cy="12" r="9"></circle><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"></path>');
/** Palette switcher glyph. */
export const paletteIcon = (): string =>
  svg('<circle cx="12" cy="12" r="9"></circle><circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="15" cy="10" r="1.3" fill="currentColor" stroke="none"></circle><circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none"></circle>');
export const copyIcon = (): string =>
  svg('<rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>');
export const checkIcon = (): string => svg('<path d="M20 6 9 17l-5-5"></path>');
export const chevronIcon = (): string => svg('<path d="m9 18 6-6-6-6"></path>');
export const arrowLeftIcon = (): string => svg('<path d="M19 12H5M12 19l-7-7 7-7"></path>');
export const arrowRightIcon = (): string => svg('<path d="M5 12h14M12 5l7 7-7 7"></path>');
export const externalIcon = (): string =>
  svg('<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>');
export const bookIcon = (): string =>
  svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>');
