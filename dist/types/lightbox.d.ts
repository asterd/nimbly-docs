import type { UIStrings } from "./i18n.js";
/** Mark images and links to images inside sanitized content as viewer triggers. */
export declare function markZoomables(root: ParentNode, label: string): void;
export declare class Lightbox {
    private readonly mount;
    private readonly s;
    private dialog;
    private stage;
    private media;
    private items;
    private index;
    private trigger;
    private x;
    private y;
    private scale;
    private pointers;
    private gesture;
    private lastTap;
    constructor(mount: HTMLElement, s: UIStrings);
    destroy(): void;
    /** Delegated click: open the viewer for an image trigger in `content`. */
    handleClick(event: MouseEvent, content: HTMLElement): boolean;
    /** Enter/Space on a focused image opens it. */
    handleKey(event: KeyboardEvent, content: HTMLElement): boolean;
    private openFrom;
    private collect;
    private create;
    private go;
    private show;
    /** Pointer position relative to the stage centre. */
    private local;
    /** Zoom to `next`, keeping the stage point (px, py) fixed under the finger/cursor. */
    private zoomTo;
    private apply;
    private down;
    /** (Re)anchor the gesture to the current pointers, so adding/removing a finger never jumps. */
    private startGesture;
    private move;
    private up;
    /** Double-tap toggles zoom at the tapped point; a tap on the backdrop closes. */
    private tap;
}
