/**
 * Firestore shapes for composition (timeline) revisions.
 *
 * The TIMELINE ITSELF is not redefined here — it is imported from
 * `design/composition-runtime`, which is the canonical schema shared with the
 * render worker. A second copy of it in the app's model layer is precisely the
 * drift the shared runtime exists to prevent: a Clip that means one thing to
 * the renderer and another to the editor is a video nobody can explain.
 *
 * What this file adds is the two Firestore-specific wrappers: the pointer
 * cached on the content doc, and the stored revision with its render lifecycle.
 */
import type { Composition } from "../../../design/composition-runtime";
import type { DesignRenderStatus } from "./design";

export type { Composition };

/**
 * Pointer cached on the content doc at `compositionRef`.
 *
 * Present only once something has AUTHORED a timeline. A video content with a
 * design and no composition still renders through the composition path — the
 * worker derives a one-clip composition from the design — so the absence of
 * this field means "nobody has edited the timeline", not "this content predates
 * timelines".
 *
 * ⚠️ `durationMs` and `clipCount` are CACHES for layout. The backend recomputes
 * both from the stored clips on every read, because they are what a render is
 * billed on. Never treat them as authoritative; call `measureComposition`.
 */
export interface IContentCompositionRef {
    revisionId: string;
    width: number;
    height: number;
    fps: number;
    /** Derived cache of the timeline's total length in ms. */
    durationMs: number;
    /** Derived cache of how many clips are on the video track. */
    clipCount: number;
    /** The rendered MP4, once there is one. */
    renderUrl?: string;
    updatedAt: number;
}

/**
 * One immutable composition revision
 * (`brands/{brandId}/contents/{contentId}/compositions/{revId}`).
 *
 * The render fields are named exactly as `IContentDesignRevision`'s are, so the
 * app's existing revision watcher follows either kind without knowing which it
 * is looking at. Unlike a design revision, these are written ONLY by the render
 * worker — firestore.rules blocks a client from them, because a composition is
 * never captured on the device and a client that could write `renderStatus`
 * could mark a render done that never ran.
 */
export interface IContentCompositionRevision {
    id?: string;
    composition: Composition;
    origin?: "timeline" | "edit" | "revert";
    parentRevisionId?: string;

    renderUrl?: string;
    posterUrl?: string;
    renderStatus?: DesignRenderStatus;
    renderProgress?: number;
    renderError?: string;
    renderJobId?: string;
    renderStartedAt?: number;
    renderedAt?: number;
    renderScale?: number;
    renderChargedTokens?: number;
    createdAt: number;
}
