/**
 * Manifest validation and normalization.
 *
 * The manifest is the single, explicit contract of Nimbly Docs. Rather than
 * pull in a JSON Schema runtime, we validate with a small, deterministic,
 * dependency-free checker that enforces both the structure and the security
 * rules from the spec (safe ids, safe source URLs, size limits, no unknown
 * executable behavior).
 */
import type {
  Manifest,
  ManifestApiReference,
  ManifestLanguage,
  ManifestLink,
  ManifestSection,
  ManifestTheme,
  ResolvedManifest,
  ResolvedPage,
} from "./types.js";
import { ID_PATTERN, LIMITS, MANIFEST_MAJOR } from "./constants.js";

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new ManifestError(`"${field}" must be a non-empty string`);
  }
  return v;
}

/**
 * Resolve a localizable title (a string, or a `{ locale: value }` map) to the
 * active locale, falling back to the default locale, then to any first value.
 */
function resolveTitle(
  value: unknown,
  field: string,
  locale: string,
  defaultLocale: string
): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (isPlainObject(value)) {
    const map = value as Record<string, unknown>;
    const pick = (code: string): string | undefined => {
      const v = map[code];
      return typeof v === "string" && v.length > 0 ? v : undefined;
    };
    const base = locale.split("-")[0]!;
    const chosen =
      pick(locale) ??
      pick(base) ??
      pick(defaultLocale) ??
      pick(defaultLocale.split("-")[0]!) ??
      Object.values(map).find((v): v is string => typeof v === "string" && v.length > 0);
    if (chosen) return chosen;
  }
  throw new ManifestError(`"${field}" must be a non-empty string or locale map`);
}

/** The major number declared in `version` (e.g. "1.2" -> 1). */
function majorOf(version: string): number {
  const m = /^(\d+)/.exec(version);
  if (!m) throw new ManifestError(`"version" is not a valid version string`);
  return Number(m[1]);
}

/**
 * Resolve a Markdown source URL against the manifest URL.
 * Only http(s) and relative references are accepted; auth material is rejected.
 */
function resolveSource(source: string, manifestUrl: string): string {
  requireString(source, "source");
  let resolved: URL;
  try {
    resolved = new URL(source, manifestUrl);
  } catch {
    throw new ManifestError(`page source "${source}" is not a resolvable URL`);
  }
  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    throw new ManifestError(`page source "${source}" must use http(s)`);
  }
  if (resolved.username || resolved.password) {
    throw new ManifestError(`page source "${source}" must not embed credentials`);
  }
  // Disallow token-like query params; protected access belongs to the proxy/SSO.
  for (const key of resolved.searchParams.keys()) {
    if (/token|auth|key|secret|password|sig/i.test(key)) {
      throw new ManifestError(`page source "${source}" must not carry auth query params`);
    }
  }
  return resolved.href;
}

interface LocaleCtx {
  locale: string;
  defaultLocale: string;
}

/** Validate a resolvable http(s)/relative source URL, returning its absolute href. */
function resolveSourceOrNull(source: string, manifestUrl: string): string | null {
  try {
    return resolveSource(source, manifestUrl);
  } catch {
    return null;
  }
}

/**
 * Pick the raw source string for the active locale.
 * Accepts `source` as a string or a `{ locale: path }` map, and merges `sources`.
 */
function pickLocalizedSource(page: Record<string, unknown>, loc: LocaleCtx): string | null {
  const map: Record<string, string> = {};
  if (isPlainObject(page.sources)) {
    for (const [code, src] of Object.entries(page.sources)) {
      if (typeof src === "string" && /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(code)) map[code.toLowerCase()] = src;
    }
  }
  if (isPlainObject(page.source)) {
    for (const [code, src] of Object.entries(page.source)) {
      if (typeof src === "string" && /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(code)) map[code.toLowerCase()] = src;
    }
  }
  const base = loc.locale.split("-")[0]!;
  const fromMap =
    map[loc.locale] ?? map[base] ?? map[loc.defaultLocale] ?? map[loc.defaultLocale.split("-")[0]!] ?? Object.values(map)[0];
  if (fromMap) return fromMap;
  if (typeof page.source === "string" && page.source) return page.source;
  return null;
}

/** Resolve an optional localizable string (description) to the active locale, if present. */
function resolveOptionalLocalized(value: unknown, loc: LocaleCtx): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (isPlainObject(value)) {
    const map = value as Record<string, unknown>;
    const base = loc.locale.split("-")[0]!;
    const pick = (c: string): string | undefined => (typeof map[c] === "string" && map[c] ? (map[c] as string) : undefined);
    return pick(loc.locale) ?? pick(base) ?? pick(loc.defaultLocale) ?? undefined;
  }
  return undefined;
}

/**
 * Build the ordered list of candidate URLs for a page source, honouring the
 * convention-over-configuration rule:
 *   1. the explicit path as given (resolved against the manifest);
 *   2. <manifestDir>/pages/<basename>;
 *   3. <manifestDir>/pages/<locale>/<basename>.
 * Duplicates are removed while preserving order. Only http(s) URLs are kept.
 */
function buildCandidates(source: string, manifestUrl: string, locale: string, defaultLocale: string): string[] {
  const out: string[] = [];
  const push = (s: string | null): void => {
    if (s && !out.includes(s)) out.push(s);
  };
  const file = source.split("/").pop() || source;
  const base = locale.split("-")[0]!;
  const isDefault = locale === defaultLocale || base === defaultLocale.split("-")[0];

  if (isDefault) {
    // Default language: honour the explicit path, then the plain pages/ file.
    push(resolveSourceOrNull(source, manifestUrl));
    push(resolveSourceOrNull(`./pages/${file}`, manifestUrl));
  } else {
    // Non-default language: prefer the localized folder so it is not shadowed by
    // the default-language file that lives directly under pages/.
    if (locale !== base) push(resolveSourceOrNull(`./pages/${locale}/${file}`, manifestUrl));
    push(resolveSourceOrNull(`./pages/${base}/${file}`, manifestUrl));
    push(resolveSourceOrNull(source, manifestUrl));
    push(resolveSourceOrNull(`./pages/${file}`, manifestUrl));
  }
  return out;
}

function validatePage(
  page: unknown,
  manifestUrl: string,
  seenIds: Set<string>,
  sectionPath: string[],
  out: { order: ResolvedPage[]; pages: Map<string, ResolvedPage> },
  loc: LocaleCtx
): ResolvedPage {
  if (!isPlainObject(page)) throw new ManifestError("each page must be an object");
  const id = requireString(page.id, "page.id");
  if (!ID_PATTERN.test(id)) {
    throw new ManifestError(`page id "${id}" must match ${ID_PATTERN}`);
  }
  if (seenIds.has(id)) throw new ManifestError(`duplicate id "${id}"`);
  seenIds.add(id);
  const title = resolveTitle(page.title, "page.title", loc.locale, loc.defaultLocale);

  // `source` may be a single string or a per-locale map; `sources` (a map) is
  // also accepted and merged. Resolve the raw source string for the active locale.
  const rawSource = pickLocalizedSource(page, loc);
  if (!rawSource) throw new ManifestError(`page "${id}" is missing a usable source`);

  const candidates = buildCandidates(rawSource, manifestUrl, loc.locale, loc.defaultLocale);
  if (candidates.length === 0) throw new ManifestError(`page "${id}" source "${rawSource}" is not resolvable`);

  const normalized = { id, title } as Omit<ResolvedPage, "url" | "candidates" | "sectionPath">;
  const description = resolveOptionalLocalized(page.description, loc);
  if (description) normalized.description = description;
  if (typeof page.badge === "string") normalized.badge = page.badge;
  if (page.hidden === true) normalized.hidden = true;

  const resolved: ResolvedPage = { ...normalized, url: candidates[0]!, candidates, sectionPath };
  out.pages.set(id, resolved);
  if (!normalized.hidden || true) out.order.push(resolved);

  if (out.pages.size > LIMITS.maxPages) {
    throw new ManifestError(`too many pages (limit ${LIMITS.maxPages})`);
  }
  return resolved;
}

function validateSection(
  section: unknown,
  manifestUrl: string,
  seenIds: Set<string>,
  parentPath: string[],
  depth: number,
  out: { order: ResolvedPage[]; pages: Map<string, ResolvedPage> },
  loc: LocaleCtx
): ManifestSection {
  if (!isPlainObject(section)) throw new ManifestError("each section must be an object");
  const id = requireString(section.id, "section.id");
  if (!ID_PATTERN.test(id)) {
    throw new ManifestError(`section id "${id}" must match ${ID_PATTERN}`);
  }
  if (seenIds.has(id)) throw new ManifestError(`duplicate id "${id}"`);
  seenIds.add(id);
  const title = resolveTitle(section.title, "section.title", loc.locale, loc.defaultLocale);
  const path = [...parentPath, title];

  const normalized: ManifestSection = { id, title, pages: [], sections: [] };
  if (typeof section.icon === "string") normalized.icon = section.icon;
  if (section.collapsed === true) normalized.collapsed = true;

  if (section.pages !== undefined) {
    if (!Array.isArray(section.pages)) throw new ManifestError(`section "${id}" pages must be an array`);
    normalized.pages = section.pages.map((p) => validatePage(p, manifestUrl, seenIds, path, out, loc));
  }
  if (section.sections !== undefined) {
    if (depth >= 1) throw new ManifestError(`section "${id}" nests too deeply (max 1 level)`);
    if (!Array.isArray(section.sections)) throw new ManifestError(`section "${id}" sections must be an array`);
    normalized.sections = section.sections.map((s) =>
      validateSection(s, manifestUrl, seenIds, path, depth + 1, out, loc)
    );
  }
  if ((normalized.pages?.length ?? 0) === 0 && (normalized.sections?.length ?? 0) === 0) {
    throw new ManifestError(`section "${id}" must contain at least one page or subsection`);
  }
  return normalized;
}

function validateThemes(themes: unknown): Map<string, ManifestTheme> {
  const map = new Map<string, ManifestTheme>();
  if (themes === undefined) return map;
  if (!Array.isArray(themes)) throw new ManifestError(`"themes" must be an array`);
  for (const t of themes) {
    if (!isPlainObject(t)) throw new ManifestError("each theme must be an object");
    const name = requireString(t.name, "theme.name");
    const theme: ManifestTheme = { name };
    if (typeof t.base === "string") theme.base = t.base as ManifestTheme["base"];
    if (isPlainObject(t.light)) theme.light = sanitizeTokens(t.light);
    if (isPlainObject(t.dark)) theme.dark = sanitizeTokens(t.dark);
    map.set(name, theme);
  }
  return map;
}

/**
 * A theme override may only set validated, simple CSS values. We reject
 * anything containing `url(`, `expression`, `;`, `}` or `javascript:` to keep
 * theming declarative and non-executable.
 */
const SAFE_TOKEN_VALUE = /^[#0-9a-z%.,()\s/_-]+$/i;
function sanitizeTokens(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v !== "string") continue;
    if (!/^[a-z0-9-]+$/i.test(k)) continue;
    const value = v.trim();
    if (value.length > 120) continue;
    if (/url\(|expression|javascript:|[;{}<>]/i.test(value)) continue;
    if (!SAFE_TOKEN_VALUE.test(value)) continue;
    out[k] = value;
  }
  return out;
}

/** Validate an external, https-only URL without embedded credentials. */
function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  return url.href;
}

function validateLinks(input: unknown): ManifestLink[] {
  if (!Array.isArray(input)) return [];
  const out: ManifestLink[] = [];
  for (const raw of input) {
    if (!isPlainObject(raw)) continue;
    const url = safeExternalUrl(raw.url);
    if (!url) continue;
    const type = typeof raw.type === "string" ? raw.type : "external";
    const link: ManifestLink = { type, url };
    if (typeof raw.label === "string" && raw.label.trim()) link.label = raw.label.trim();
    out.push(link);
  }
  return out;
}

function validateApiReference(input: unknown): ManifestApiReference | undefined {
  if (!isPlainObject(input)) return undefined;
  const url = safeExternalUrl(input.url);
  if (!url) return undefined;
  const ref: ManifestApiReference = { url };
  if (typeof input.label === "string" && input.label.trim()) ref.label = input.label.trim();
  return ref;
}

function validateLanguages(input: unknown): ManifestLanguage[] {
  if (!Array.isArray(input)) return [];
  const out: ManifestLanguage[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!isPlainObject(raw)) continue;
    if (typeof raw.code !== "string" || !/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(raw.code)) continue;
    const code = raw.code.toLowerCase();
    if (seen.has(code)) continue;
    const label = typeof raw.label === "string" && raw.label.trim() ? raw.label.trim() : code;
    seen.add(code);
    out.push({ code, label });
  }
  return out;
}

/**
 * Validate and normalize a raw manifest object fetched from `manifestUrl`.
 * Throws {@link ManifestError} on any structural or security violation.
 */
export function normalizeManifest(raw: unknown, manifestUrl: string, locale = ""): ResolvedManifest {
  if (!isPlainObject(raw)) throw new ManifestError("manifest must be a JSON object");

  const version = requireString(raw.version, "version");
  if (majorOf(version) !== MANIFEST_MAJOR) {
    throw new ManifestError(
      `manifest major ${majorOf(version)} is not supported by viewer major ${MANIFEST_MAJOR}`
    );
  }
  const language = typeof raw.language === "string" ? raw.language : "en";
  const languages = validateLanguages(raw.languages);
  const defaultLocale = languages[0]?.code || language;
  // Title itself may be a locale map.
  const title = resolveTitle(raw.title, "title", locale || defaultLocale, defaultLocale);
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    throw new ManifestError(`"sections" must be a non-empty array`);
  }

  const loc: LocaleCtx = { locale: locale || defaultLocale, defaultLocale };
  const out = { order: [] as ResolvedPage[], pages: new Map<string, ResolvedPage>() };
  const seenIds = new Set<string>();
  const sections = raw.sections.map((s) => validateSection(s, manifestUrl, seenIds, [], 0, out, loc));

  if (out.pages.size === 0) throw new ManifestError("manifest must contain at least one page");

  const f = isPlainObject(raw.features) ? raw.features : {};
  const sidebar = isPlainObject(f.sidebar) ? f.sidebar : {};
  const features: ResolvedManifest["features"] = {
    search: f.search !== false,
    toc: f.toc !== false,
    copyCode: f.copyCode !== false,
    previousNext: f.previousNext !== false,
    breadcrumbs: f.breadcrumbs !== false,
    editLink: f.editLink === true,
    sidebar: {
      collapsible: sidebar.collapsible !== false,
      defaultExpanded: Array.isArray(sidebar.defaultExpanded)
        ? (sidebar.defaultExpanded.filter((x) => typeof x === "string") as string[])
        : [],
    },
  };

  const homeId =
    typeof raw.home === "string" && out.pages.has(raw.home)
      ? raw.home
      : out.order[0]!.id;

  const resolved: ResolvedManifest = {
    raw: raw as unknown as Manifest,
    manifestUrl,
    title,
    language,
    theme: typeof raw.theme === "string" ? raw.theme : "auto",
    homeId,
    features,
    order: out.order,
    pages: out.pages,
    sections,
    themes: validateThemes(raw.themes),
    links: validateLinks(raw.links),
    languages,
    defaultLanguage: defaultLocale,
  };
  const apiRef = validateApiReference(raw.apiReference);
  if (apiRef) resolved.apiReference = apiRef;
  if (typeof raw.logo === "string") {
    const logo = new URL(raw.logo, manifestUrl);
    if ((logo.protocol === "https:" || logo.protocol === "http:") && !logo.username && !logo.password) {
      resolved.logo = logo.href;
    }
  }
  if (typeof raw.editBase === "string") resolved.editBase = raw.editBase;
  if (typeof raw.footer === "string") resolved.footer = raw.footer;
  return resolved;
}
