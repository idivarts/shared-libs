/**
 * HTML design model — the AI authors a post as a single self-contained HTML/CSS
 * document rendered in a WebView (WYSIWYG) and captured to PNG(s) on approve.
 * Keep in sync with backend content_design.go.
 */

export type DesignDocType = "image" | "video";

/** Lightweight pointer to the current design revision, on the content doc. */
export interface IContentDesignRef {
    revisionId: string;
    docType: DesignDocType;
    width: number; // per-slide width
    height: number; // per-slide height
    /** Number of carousel slides (1 for a single post). */
    slideCount: number;
    /** Animation length in ms for a video design (0 for images). */
    durationMs?: number;
    /** First frontend-captured PNG (cover) used for publish/Canva. */
    renderUrl?: string;
    updatedAt: number;
}

/** One immutable HTML design revision (contents/{id}/designs/{revId}). */
export interface IContentDesignRevision {
    id?: string;
    html: string;
    width: number; // per-slide width
    height: number; // per-slide height
    slideCount: number;
    durationMs?: number;
    docType: DesignDocType;
    origin?: "generate" | "edit" | "text" | "revert";
    parentRevisionId?: string;
    renderUrl?: string;
    createdAt: number;
}

/** Generated audio attached to a (video) content, muxed at render time. */
export interface IContentAudio {
    musicId?: string;
    musicUrl?: string;
    musicVolume?: number;
    voiceoverId?: string;
    voiceoverUrl?: string;
    duckMusic?: boolean;
    captionSource?: string;
}
