import { badgeTone } from "./markdown.js";
import type { ManifestBadge } from "./types.js";

export function badgeLabel(badge: ManifestBadge): string {
  if (typeof badge === "string") return badge;
  return typeof badge.label === "string" ? badge.label : Object.values(badge.label)[0] ?? "";
}

/** Reuse the established theme tokens and legacy string classifications. */
export function badgeClass(badge: ManifestBadge): string {
  if (typeof badge === "string" || !badge.tone) return badgeTone(badgeLabel(badge));
  return { neutral: "neutral", success: "new", warning: "trial", danger: "deprecated", info: "info" }[badge.tone];
}
