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
export const globeIcon = (): string =>
  svg('<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"></path>');
export const apiIcon = (): string =>
  svg('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"></path><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"></path>');
// Brand marks use fill (not stroke) so their silhouettes read correctly.
const brandSvg = (path: string): string =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">${path}</svg>`;
export const githubIcon = (): string =>
  brandSvg('<path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.42.37.8 1.1.8 2.22v3.29c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"></path>');
export const linkedinIcon = (): string =>
  brandSvg('<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0z"></path>');
