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
  ManifestPage,
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

function validatePage(
  page: unknown,
  manifestUrl: string,
  seenIds: Set<string>,
  sectionPath: string[],
  out: { order: ResolvedPage[]; pages: Map<string, ResolvedPage> }
): ManifestPage {
  if (!isPlainObject(page)) throw new ManifestError("each page must be an object");
  const id = requireString(page.id, "page.id");
  if (!ID_PATTERN.test(id)) {
    throw new ManifestError(`page id "${id}" must match ${ID_PATTERN}`);
  }
  if (seenIds.has(id)) throw new ManifestError(`duplicate id "${id}"`);
  seenIds.add(id);
  const title = requireString(page.title, "page.title");
  const url = resolveSource(page.source as string, manifestUrl);

  const normalized: ManifestPage = { id, title, source: page.source as string };
  if (typeof page.description === "string") normalized.description = page.description;
  if (typeof page.badge === "string") normalized.badge = page.badge;
  if (page.hidden === true) normalized.hidden = true;

  const resolved: ResolvedPage = { ...normalized, url, sectionPath };
  out.pages.set(id, resolved);
  if (!normalized.hidden || true) out.order.push(resolved);

  if (out.pages.size > LIMITS.maxPages) {
    throw new ManifestError(`too many pages (limit ${LIMITS.maxPages})`);
  }
  return normalized;
}

function validateSection(
  section: unknown,
  manifestUrl: string,
  seenIds: Set<string>,
  parentPath: string[],
  depth: number,
  out: { order: ResolvedPage[]; pages: Map<string, ResolvedPage> }
): ManifestSection {
  if (!isPlainObject(section)) throw new ManifestError("each section must be an object");
  const id = requireString(section.id, "section.id");
  if (!ID_PATTERN.test(id)) {
    throw new ManifestError(`section id "${id}" must match ${ID_PATTERN}`);
  }
  if (seenIds.has(id)) throw new ManifestError(`duplicate id "${id}"`);
  seenIds.add(id);
  const title = requireString(section.title, "section.title");
  const path = [...parentPath, title];

  const normalized: ManifestSection = { id, title, pages: [], sections: [] };
  if (typeof section.icon === "string") normalized.icon = section.icon;
  if (section.collapsed === true) normalized.collapsed = true;

  if (section.pages !== undefined) {
    if (!Array.isArray(section.pages)) throw new ManifestError(`section "${id}" pages must be an array`);
    normalized.pages = section.pages.map((p) => validatePage(p, manifestUrl, seenIds, path, out));
  }
  if (section.sections !== undefined) {
    if (depth >= 1) throw new ManifestError(`section "${id}" nests too deeply (max 1 level)`);
    if (!Array.isArray(section.sections)) throw new ManifestError(`section "${id}" sections must be an array`);
    normalized.sections = section.sections.map((s) =>
      validateSection(s, manifestUrl, seenIds, path, depth + 1, out)
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

/**
 * Validate and normalize a raw manifest object fetched from `manifestUrl`.
 * Throws {@link ManifestError} on any structural or security violation.
 */
export function normalizeManifest(raw: unknown, manifestUrl: string): ResolvedManifest {
  if (!isPlainObject(raw)) throw new ManifestError("manifest must be a JSON object");

  const version = requireString(raw.version, "version");
  if (majorOf(version) !== MANIFEST_MAJOR) {
    throw new ManifestError(
      `manifest major ${majorOf(version)} is not supported by viewer major ${MANIFEST_MAJOR}`
    );
  }
  const title = requireString(raw.title, "title");
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    throw new ManifestError(`"sections" must be a non-empty array`);
  }

  const out = { order: [] as ResolvedPage[], pages: new Map<string, ResolvedPage>() };
  const seenIds = new Set<string>();
  const sections = raw.sections.map((s) => validateSection(s, manifestUrl, seenIds, [], 0, out));

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
    language: typeof raw.language === "string" ? raw.language : "en",
    theme: typeof raw.theme === "string" ? raw.theme : "auto",
    homeId,
    features,
    order: out.order,
    pages: out.pages,
    sections,
    themes: validateThemes(raw.themes),
  };
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
