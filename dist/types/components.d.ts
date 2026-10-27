import type { CalloutKind } from "./markdown.js";
export type CalloutLabels = Record<CalloutKind, string>;
/** Upgrade callouts and tab containers inside freshly sanitized content. */
export declare function enhanceComponents(root: ParentNode, labels: CalloutLabels): void;
/** Delegated click handler for tab buttons. Returns true if handled. */
export declare function handleTabClick(target: EventTarget | null, scope: ParentNode): boolean;
/** Arrow/Home/End keyboard navigation within a tab list. Returns true if handled. */
export declare function handleTabKeydown(event: KeyboardEvent, scope: ParentNode): boolean;
