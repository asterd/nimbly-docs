/**
 * A compact YAML reader for API descriptions.
 *
 * OpenAPI/Swagger documents are usually YAML, but a full YAML 1.2 engine would
 * dwarf the rest of the bundle. This reader covers the subset real API
 * descriptions use: block mappings and sequences (including sequences at the
 * key's indentation), plain/single/double-quoted scalars (also multi-line),
 * literal and folded block scalars with chomping and indentation indicators,
 * single- and multi-line flow collections, comments, document markers,
 * anchors/aliases and `<<` merge keys. Tags are ignored and complex (`?`) keys
 * are rejected.
 *
 * It produces plain data only: no custom types are ever constructed, aliases
 * share references instead of copying (no "billion laughs" blow-up) and
 * `__proto__` keys are stored as own properties, never as prototypes.
 */
export declare class YamlError extends Error {
    constructor(message: string, line: number);
}
/** Parse a YAML document into plain JavaScript values. */
export declare function parseYaml(source: string): unknown;
