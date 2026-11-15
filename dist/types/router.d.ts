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
export declare function parseHash(hash: string): Route;
/** Set the documentation version every built route should carry (null = default). */
export declare function setRouteVersion(version: string | null): void;
export declare function buildHash(pageId: string, anchor?: string | null, version?: string | null): string;
export declare class Router {
    private handler;
    private boundOnHashChange;
    start(handler: (route: Route) => void): void;
    stop(): void;
    current(): Route;
    /** Navigate by updating the hash. Pass `replace` to avoid a history entry. */
    go(pageId: string, anchor?: string | null, replace?: boolean, version?: string | null): void;
}
