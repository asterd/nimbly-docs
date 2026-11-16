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
  pageTools: string;
  downloads: string;
  downloadSource: string;
  downloadPage: string;
  downloadFiles: string;
  revision: string;
  revisionDate: string;
  revisionBranch: string;
  revisionCommit: string;
  revisionSource: string;
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
  theme: string;
  /** Default callout titles. */
  note: string;
  tip: string;
  important: string;
  warning: string;
  danger: string;
  /** Version selector label. */
  version: string;
  /** Banner for legacy versions; `{version}` is replaced by the version label. */
  versionLegacy: string;
  /** Banner for unreleased versions; `{version}` is replaced by the version label. */
  versionUnreleased: string;
  /** Link from a version banner to the default version. */
  versionLatest: string;
  /** Integrated API reference. */
  apiSpec: string;
  apiEndpoints: string;
  apiParameters: string;
  apiRequestBody: string;
  apiResponses: string;
  apiHeaders: string;
  apiSchemas: string;
  apiSchema: string;
  apiExample: string;
  apiProperties: string;
  apiServers: string;
  apiAuth: string;
  apiRequired: string;
  apiDeprecated: string;
  apiEnum: string;
  apiDefault: string;
  apiOneOf: string;
  apiAnyOf: string;
  apiRecursive: string;
  apiFilter: string;
  apiExpandAll: string;
  apiCollapseAll: string;
  apiNoMatch: string;
  /** Image viewer. */
  viewerOpen: string;
  viewerClose: string;
  viewerPrevious: string;
  viewerNext: string;
  viewerZoomIn: string;
  viewerZoomOut: string;
  viewerOriginal: string;
}

const en: UIStrings = {
  pageTools: "Document information and downloads",
  downloads: "Downloads",
  downloadSource: "Markdown source",
  downloadPage: "This page",
  downloadFiles: "Files",
  revision: "Version and sources",
  revisionDate: "Updated",
  revisionBranch: "Branch",
  revisionCommit: "Commit",
  revisionSource: "Source",
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
  theme: "Theme",
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  danger: "Danger",
  version: "Version",
  versionLegacy: "You are viewing the documentation for {version}, which is no longer actively maintained.",
  versionUnreleased: "You are viewing unreleased documentation for {version}.",
  versionLatest: "Go to the latest version",
  apiSpec: "API specification",
  apiEndpoints: "Endpoints",
  apiParameters: "Parameters",
  apiRequestBody: "Request body",
  apiResponses: "Responses",
  apiHeaders: "Headers",
  apiSchemas: "Schemas",
  apiSchema: "Schema",
  apiExample: "Example",
  apiProperties: "Properties",
  apiServers: "Servers",
  apiAuth: "Authentication",
  apiRequired: "required",
  apiDeprecated: "deprecated",
  apiEnum: "Allowed",
  apiDefault: "Default",
  apiOneOf: "One of",
  apiAnyOf: "Any of",
  apiRecursive: "recursive",
  apiFilter: "Filter endpoints",
  apiExpandAll: "Expand all",
  apiCollapseAll: "Collapse all",
  apiNoMatch: "No endpoint matches this filter.",
  viewerOpen: "Open image",
  viewerClose: "Close",
  viewerPrevious: "Previous image",
  viewerNext: "Next image",
  viewerZoomIn: "Zoom in",
  viewerZoomOut: "Zoom out",
  viewerOriginal: "Open original",
};

const DICTIONARIES: Record<string, Partial<UIStrings>> = {
  en,
  it: {
    pageTools: "Informazioni e download del documento",
    downloads: "Download",
    downloadSource: "Sorgente Markdown",
    downloadPage: "Questa pagina",
    downloadFiles: "Allegati",
    revision: "Versione e fonti",
    revisionDate: "Aggiornata il",
    revisionBranch: "Branch",
    revisionCommit: "Commit",
    revisionSource: "Fonte",
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
    theme: "Tema",
    note: "Nota",
    tip: "Suggerimento",
    important: "Importante",
    warning: "Attenzione",
    danger: "Pericolo",
    version: "Versione",
    versionLegacy: "Stai consultando la documentazione di {version}, non più mantenuta attivamente.",
    versionUnreleased: "Stai consultando la documentazione non ancora rilasciata di {version}.",
    versionLatest: "Vai alla versione più recente",
    apiSpec: "Specifica API",
    apiEndpoints: "Endpoint",
    apiParameters: "Parametri",
    apiRequestBody: "Corpo della richiesta",
    apiResponses: "Risposte",
    apiHeaders: "Header",
    apiSchemas: "Schemi",
    apiSchema: "Schema",
    apiExample: "Esempio",
    apiProperties: "Proprietà",
    apiServers: "Server",
    apiAuth: "Autenticazione",
    apiRequired: "obbligatorio",
    apiDeprecated: "deprecato",
    apiEnum: "Valori ammessi",
    apiDefault: "Predefinito",
    apiOneOf: "Uno tra",
    apiAnyOf: "Uno o più tra",
    apiRecursive: "ricorsivo",
    apiFilter: "Filtra endpoint",
    apiExpandAll: "Espandi tutto",
    apiCollapseAll: "Comprimi tutto",
    apiNoMatch: "Nessun endpoint corrisponde al filtro.",
    viewerOpen: "Apri immagine",
    viewerClose: "Chiudi",
    viewerPrevious: "Immagine precedente",
    viewerNext: "Immagine successiva",
    viewerZoomIn: "Ingrandisci",
    viewerZoomOut: "Riduci",
    viewerOriginal: "Apri originale",
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
    theme: "Tema",
    note: "Nota",
    tip: "Consejo",
    important: "Importante",
    warning: "Advertencia",
    danger: "Peligro",
    version: "Versión",
    versionLegacy: "Estás viendo la documentación de {version}, que ya no se mantiene activamente.",
    versionUnreleased: "Estás viendo documentación no publicada de {version}.",
    versionLatest: "Ir a la última versión",
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
    theme: "Thème",
    note: "Note",
    tip: "Astuce",
    important: "Important",
    warning: "Attention",
    danger: "Danger",
    version: "Version",
    versionLegacy: "Vous consultez la documentation de {version}, qui n'est plus activement maintenue.",
    versionUnreleased: "Vous consultez une documentation non publiée de {version}.",
    versionLatest: "Aller à la dernière version",
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
    theme: "Thema",
    note: "Hinweis",
    tip: "Tipp",
    important: "Wichtig",
    warning: "Warnung",
    danger: "Gefahr",
    version: "Version",
    versionLegacy: "Sie sehen die Dokumentation für {version}, die nicht mehr aktiv gepflegt wird.",
    versionUnreleased: "Sie sehen unveröffentlichte Dokumentation für {version}.",
    versionLatest: "Zur neuesten Version",
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
