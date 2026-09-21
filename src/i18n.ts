/**
 * Lightweight UI localization.
 *
 * Only the handful of chrome strings the viewer renders are translated here.
 * Documentation content itself is authored Markdown (optionally per-locale via
 * `page.sources`), so there is no runtime translation engine and no weight cost
 * beyond this small dictionary.
 */
import { APPEARANCE_STORAGE_KEY } from "./constants.js";

export interface UIStrings {
  searchPlaceholder: string;
  searchAria: string;
  onThisPage: string;
  documentation: string;
  previous: string;
  next: string;
  closeSearch: string;
  noResults: string;
  startTyping: string;
  openNav: string;
  closeNav: string;
  skipToContent: string;
  language: string;
  apiReference: string;
  poweredBy: string;
  backToApp: string;
}

const en: UIStrings = {
  searchPlaceholder: "Search documentation",
  searchAria: "Search documentation",
  onThisPage: "On this page",
  documentation: "Documentation",
  previous: "Previous",
  next: "Next",
  closeSearch: "Close search",
  noResults: "No pages match that search.",
  startTyping: "Start typing to search the documentation.",
  openNav: "Open navigation",
  closeNav: "Close navigation",
  skipToContent: "Skip to content",
  language: "Language",
  apiReference: "API reference",
  poweredBy: "Powered by",
  backToApp: "Back to app",
};

const DICTIONARIES: Record<string, Partial<UIStrings>> = {
  en,
  it: {
    searchPlaceholder: "Cerca nella documentazione",
    searchAria: "Cerca nella documentazione",
    onThisPage: "In questa pagina",
    documentation: "Documentazione",
    previous: "Precedente",
    next: "Successivo",
    closeSearch: "Chiudi ricerca",
    noResults: "Nessuna pagina corrisponde.",
    startTyping: "Inizia a digitare per cercare.",
    openNav: "Apri navigazione",
    closeNav: "Chiudi navigazione",
    skipToContent: "Salta al contenuto",
    language: "Lingua",
    apiReference: "Riferimento API",
    poweredBy: "Powered by",
    backToApp: "Torna all'app",
  },
  es: {
    searchPlaceholder: "Buscar en la documentación",
    searchAria: "Buscar en la documentación",
    onThisPage: "En esta página",
    documentation: "Documentación",
    previous: "Anterior",
    next: "Siguiente",
    closeSearch: "Cerrar búsqueda",
    noResults: "Ninguna página coincide.",
    startTyping: "Empieza a escribir para buscar.",
    openNav: "Abrir navegación",
    closeNav: "Cerrar navegación",
    skipToContent: "Saltar al contenido",
    language: "Idioma",
    apiReference: "Referencia de API",
    poweredBy: "Powered by",
    backToApp: "Volver a la app",
  },
  fr: {
    searchPlaceholder: "Rechercher dans la documentation",
    searchAria: "Rechercher dans la documentation",
    onThisPage: "Sur cette page",
    documentation: "Documentation",
    previous: "Précédent",
    next: "Suivant",
    closeSearch: "Fermer la recherche",
    noResults: "Aucune page ne correspond.",
    startTyping: "Commencez à taper pour rechercher.",
    openNav: "Ouvrir la navigation",
    closeNav: "Fermer la navigation",
    skipToContent: "Aller au contenu",
    language: "Langue",
    apiReference: "Référence API",
    poweredBy: "Powered by",
    backToApp: "Retour à l'app",
  },
  de: {
    searchPlaceholder: "Dokumentation durchsuchen",
    searchAria: "Dokumentation durchsuchen",
    onThisPage: "Auf dieser Seite",
    documentation: "Dokumentation",
    previous: "Zurück",
    next: "Weiter",
    closeSearch: "Suche schließen",
    noResults: "Keine Seite gefunden.",
    startTyping: "Zum Suchen tippen.",
    openNav: "Navigation öffnen",
    closeNav: "Navigation schließen",
    skipToContent: "Zum Inhalt springen",
    language: "Sprache",
    apiReference: "API-Referenz",
    poweredBy: "Powered by",
    backToApp: "Zurück zur App",
  },
};

/** Resolve the UI strings for a locale, falling back to English per key. */
export function stringsFor(locale: string): UIStrings {
  const base = locale.toLowerCase().split("-")[0]!;
  return { ...en, ...(DICTIONARIES[base] ?? {}) };
}

const LOCALE_STORAGE_KEY = "nimbly-docs:locale";

export function persistedLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistLocale(code: string): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
  } catch {
    /* storage may be unavailable */
  }
}

// Re-exported so callers keep a single import site for storage keys.
export { APPEARANCE_STORAGE_KEY };
