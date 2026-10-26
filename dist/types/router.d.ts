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
export declare function parseHash(hash: string): Route;
export declare function buildHash(pageId: string, anchor?: string | null): string;
export declare class Router {
    private handler;
    private boundOnHashChange;
    start(handler: (route: Route) => void): void;
    stop(): void;
    current(): Route;
    /** Navigate by updating the hash. Pass `replace` to avoid a history entry. */
    go(pageId: string, anchor?: string | null, replace?: boolean): void;
}
