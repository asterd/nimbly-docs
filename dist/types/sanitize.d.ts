/**
 * HTML sanitizer (allow-list based).
 *
 * The Markdown parser never emits raw user HTML, but rendered output can still
 * carry attributes (href/src) that must be validated. This sanitizer parses the
 * HTML with the browser's own parser into an inert document, walks the tree,
 * drops any element/attribute not on the allow-list, and neutralizes dangerous
 * URLs. The result is a safe string reinserted through trusted APIs.
 */
/** Escape the five significant HTML characters. */
export declare function escapeHtml(s: string): string;
/** Escape only characters significant inside a double-quoted attribute value. */
export declare function escapeAttr(s: string): string;
export interface SanitizeOptions {
    /** Allow http: (not just https:) for image/link sources. Default false → http images blocked. */
    allowHttpImages?: boolean;
    /** Warn (dev only) about images without alt text. */
    warnMissingAlt?: boolean;
}
/**
 * Sanitize an HTML fragment string. Returns a DocumentFragment ready to mount,
 * plus a sanitized HTML string for callers that prefer strings.
 */
export declare function sanitizeToFragment(html: string, opts?: SanitizeOptions): DocumentFragment;
