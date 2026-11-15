/**
 * Manifest validation and normalization.
 *
 * The manifest is the single, explicit contract of Nimbly Docs. Rather than
 * pull in a JSON Schema runtime, we validate with a small, deterministic,
 * dependency-free checker that enforces both the structure and the security
 * rules from the spec (safe ids, safe source URLs, size limits, no unknown
 * executable behavior).
 */
import type { ResolvedManifest } from "./types.js";
export declare class ManifestError extends Error {
    constructor(message: string);
}
/**
 * Validate and normalize a raw manifest object fetched from `manifestUrl`.
 * Throws {@link ManifestError} on any structural or security violation.
 */
export declare function normalizeManifest(raw: unknown, manifestUrl: string, locale?: string): ResolvedManifest;
