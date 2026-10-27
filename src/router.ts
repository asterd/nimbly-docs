/**
 * Hash-based router.
 *
 * Route grammar:  #/[@<version>/]<page-id>[#<anchor>]
 * Examples:
 *   #/introduzione
 *   #/api/ordini
 *   #/introduzione#installazione
 *   #/@2.x/introduzione
 *
 * The first hash segment identifies the page; an optional second `#` segment
 * is an in-page anchor. A leading `@<version>/` segment selects a non-default
 * documentation version (page ids can never start with `@`, so this is
 * unambiguous). Hash routing needs no server rewrite rules.
 */
export interface Route {
  pageId: string | null;
  anchor: string | null;
  /** Documentation version id, or null for the default version. */
  version: string | null;
}

export function parseHash(hash: string): Route {
  // Strip the leading '#'
  let h = hash.startsWith("#") ? hash.slice(1) : hash;
  // Expected form: "/pageId" or "/pageId#anchor", optionally prefixed by "@version/"
  if (h.startsWith("/")) h = h.slice(1);
  let version: string | null = null;
  if (h.startsWith("@")) {
    const slash = h.indexOf("/");
    version = decodeURIComponent(slash === -1 ? h.slice(1) : h.slice(1, slash)) || null;
    h = slash === -1 ? "" : h.slice(slash + 1);
  }
  if (h.length === 0) return { pageId: null, anchor: null, version };
  const hashIdx = h.indexOf("#");
  if (hashIdx === -1) {
    return { pageId: decodeURIComponent(h) || null, anchor: null, version };
  }
  const pageId = decodeURIComponent(h.slice(0, hashIdx)) || null;
  const anchor = decodeURIComponent(h.slice(hashIdx + 1)) || null;
  return { pageId, anchor, version };
}

/**
 * The version prefix applied by {@link buildHash}. The hash is a single,
 * window-wide resource, so the active version is too.
 */
let routeVersion: string | null = null;

/** Set the documentation version every built route should carry (null = default). */
export function setRouteVersion(version: string | null): void {
  routeVersion = version;
}

export function buildHash(pageId: string, anchor?: string | null, version: string | null = routeVersion): string {
  const prefix = version ? `@${encodeURIComponent(version)}/` : "";
  const base = `#/${prefix}${encodeURI(pageId)}`;
  return anchor ? `${base}#${encodeURI(anchor)}` : base;
}

export class Router {
  private handler: (route: Route) => void = () => {};
  private boundOnHashChange = () => this.handler(this.current());

  start(handler: (route: Route) => void): void {
    this.handler = handler;
    window.addEventListener("hashchange", this.boundOnHashChange);
    // Fire once for the initial route.
    handler(this.current());
  }

  stop(): void {
    window.removeEventListener("hashchange", this.boundOnHashChange);
  }

  current(): Route {
    return parseHash(window.location.hash);
  }

  /** Navigate by updating the hash. Pass `replace` to avoid a history entry. */
  go(pageId: string, anchor?: string | null, replace = false, version?: string | null): void {
    const hash = version === undefined ? buildHash(pageId, anchor) : buildHash(pageId, anchor, version);
    if (replace) {
      const url = window.location.pathname + window.location.search + hash;
      window.history.replaceState(null, "", url);
      this.handler(this.current());
    } else {
      window.location.hash = hash;
    }
  }
}
