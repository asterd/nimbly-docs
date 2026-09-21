import { NimblyDocsElement } from "./element.js";

export { NimblyDocsElement } from "./element.js";
export type {
  DocsError, Manifest, ManifestFeatures, ManifestPage, ManifestSection, ManifestTheme,
  NimblyPlugin, PluginContext, ResolvedManifest, ResolvedPage, SearchHit, TocEntry, ViewerOptions,
} from "./types.js";

/** Register the element automatically when the module is loaded in a browser. */
if (!customElements.get("nimbly-docs")) {
  customElements.define("nimbly-docs", NimblyDocsElement);
}
