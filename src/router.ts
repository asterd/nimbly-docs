/**
 * Hash-based router.
 *
 * Route grammar:  #/<page-id>[#<anchor>]
 * Examples:
 *   #/introduzione
 *   #/api/ordini
 *   #/introduzione#installazione
 *
 * The first hash segment identifies the page; an optional second `#` segment
 * is an in-page anchor. Hash routing needs no server rewrite rules.
 */
export interface Route {
  pageId: string | null;
  anchor: string | null;
}

export function parseHash(hash: string): Route {
  // Strip the leading '#'
  let h = hash.startsWith("#") ? hash.slice(1) : hash;
  // Expected form: "/pageId" or "/pageId#anchor"
  if (h.startsWith("/")) h = h.slice(1);
  if (h.length === 0) return { pageId: null, anchor: null };
  const hashIdx = h.indexOf("#");
  if (hashIdx === -1) {
    return { pageId: decodeURIComponent(h) || null, anchor: null };
  }
  const pageId = decodeURIComponent(h.slice(0, hashIdx)) || null;
  const anchor = decodeURIComponent(h.slice(hashIdx + 1)) || null;
  return { pageId, anchor };
}

export function buildHash(pageId: string, anchor?: string | null): string {
  const base = `#/${encodeURI(pageId)}`;
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
  go(pageId: string, anchor?: string | null, replace = false): void {
    const hash = buildHash(pageId, anchor);
    if (replace) {
      const url = window.location.pathname + window.location.search + hash;
      window.history.replaceState(null, "", url);
      this.handler(this.current());
    } else {
      window.location.hash = hash;
    }
  }
}
