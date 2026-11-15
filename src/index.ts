import { NimblyDocsElement } from "./element.js";

export { NimblyDocsElement } from "./element.js";
export type {
  DocsError, Manifest, ManifestApiReference, ManifestFeatures, ManifestLanguage, ManifestLink,
  ManifestPage, ManifestSection, ManifestTheme, NimblyPlugin, PluginContext, ResolvedManifest,
  ResolvedPage, SearchHit, TocEntry, ViewerOptions,
  BadgeTone, ManifestBadge, ManifestAttachment, ResolvedAttachment, ManifestRevision,
} from "./types.js";

/** Register the element automatically when the module is loaded in a browser. */
if (!customElements.get("nimbly-docs")) {
  customElements.define("nimbly-docs", NimblyDocsElement);
}
