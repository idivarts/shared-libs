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
    musicTitle?: string;
    musicVolume?: number; // 0..1
    musicFade?: boolean;
    voiceoverId?: string;
    voiceoverUrl?: string;
    voiceoverVolume?: number; // 0..1
    duckMusic?: boolean;
    captionSource?: string;
}

/** A curated music-library track (musicLibrary catalog). */
export interface IMusicTrack {
    id: string;
    title: string;
    moods: string[];
    url: string;
    durationMs: number;
    provider: string;
}

/** An ElevenLabs voice for the voiceover picker. */
export interface IVoice {
    voice_id: string;
    name: string;
    category?: string;
    labels?: Record<string, string>;
    preview_url?: string;
}
