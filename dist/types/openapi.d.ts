import type { UIStrings } from "./i18n.js";
import type { RenderedDoc } from "./types.js";
type J = any;
export declare class ApiSpecError extends Error {
    constructor(message: string);
}
/** Parse a JSON or YAML OpenAPI 3.x / Swagger 2.0 document. */
export declare function parseApiSpec(text: string): J;
export interface ApiRender {
    doc: RenderedDoc;
    /** Lazily rendered bodies keyed by the id of their `<details>`. */
    bodies: Map<string, () => string>;
    /** Lower-cased filter text keyed by the id of each operation/schema. */
    search: Map<string, string>;
}
/** Render a parsed spec into an HTML document, a TOC and searchable text. */
export declare function renderApi(spec: J, s: UIStrings): ApiRender;
/**
 * Wire the rendered API page: lazy bodies, the endpoint filter and expand/
 * collapse controls. `renderBody` turns body HTML into a sanitized fragment
 * through the same pipeline as the page itself.
 */
export declare function enhanceApi(root: ParentNode, api: ApiRender, renderBody: (html: string) => DocumentFragment, s: UIStrings): void;
export {};
