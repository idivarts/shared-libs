/**
 * HTML design model — the AI authors a post as a single self-contained HTML/CSS
 * document. The app renders it in a frame for PREVIEW only; the publishable
 * PNG/MP4 is produced server-side by the render worker (headless Chromium +
 * FFmpeg), which owns every `render*` field below.
 * Keep in sync with backend content_design.go.
 */

export type DesignDocType = "image" | "video";

/**
 * Lifecycle of the server render for one revision.
 *
 * Absent entirely on revisions created before server rendering existed — treat
 * `undefined` with a `renderUrl` as "done", and `undefined` without one as
 * "never rendered", so old content keeps behaving.
 */
export type DesignRenderStatus = "queued" | "rendering" | "done" | "failed";

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
    /** Cover PNG (images) or the MP4 (video). Written ONLY by the render worker. */
    renderUrl?: string;
    /** Poster frame of a video render, for previews that can't play a video. */
    posterUrl?: string;
    renderStatus?: DesignRenderStatus;
    /** 0..1 while frames are captured; absent while indeterminate. */
    renderProgress?: number;
    /** Why the render failed, phrased for the user. */
    renderError?: string;
    /** Batch job id / Lambda request id — for support and the stuck-job cron. */
    renderJobId?: string;
    /** When the worker picked the job up (ms); lets a cron expire stuck renders. */
    renderStartedAt?: number;
    /** When the render landed (ms). */
    renderedAt?: number;
    /** deviceScaleFactor the worker used, so a re-render matches pixel for pixel. */
    renderScale?: number;
    /**
     * Wallet tokens already charged for this revision. Non-zero means a retry
     * after a failure is free — the user paid for the attempt we lost.
     */
    renderChargedTokens?: number;
    createdAt: number;
}

/** Generated audio attached to a (video) content, muxed at render time. */
export interface IContentAudio {
    musicId?: string;
    musicUrl?: string;
    musicTitle?: string;
    musicVolume?: number; // 0..1
    /**
     * @deprecated Ignored. A fade is applied to every bed at render, always —
     * a bed that stops dead on the last frame sounds unfinished every time and
     * nobody wants the other option. The switch this backed was implemented
     * nowhere, so it was a control that lied.
     */
    musicFade?: boolean;
    voiceoverId?: string;
    voiceoverUrl?: string;
    voiceoverVolume?: number; // 0..1
    /**
     * The clips' ACTUAL lengths, measured in the app once the content is open
     * and written back. A generated length is only what was asked for, and a
     * voiceover's length is not knowable from its text at all — so without
     * these the backend cannot tell whether the voice overruns the video,
     * which is the commonest way a render comes out wrong.
     */
    musicMs?: number;
    voiceoverMs?: number;
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
