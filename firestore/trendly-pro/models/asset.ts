/**
 * The brand's asset library — `brands/{brandId}/assets/{assetId}`.
 *
 * Mirrors `backend-sls/internal/models/trendlymodels/asset.go`. Field names and
 * optionality are the Go struct's `json` tags, because the app receives these
 * rows over `GET /api/v2/brands/{brandId}/assets` rather than reading the
 * collection directly: that endpoint UNIONS the stored rows with a derived view
 * of every content attachment, so the library is complete from day one with no
 * migration. A row read straight from Firestore would be the stored half only.
 *
 * ── Why a collection at all ─────────────────────────────────────────────────
 * The "media library" used to be a scan over every content's `attachments`
 * array, which held nothing but a URL. That stopped working the moment assets
 * acquired FACTS about themselves — a photographer to credit, a licence that
 * forbids re-hosting, a transcript, an in and out point. None of those fit on
 * an `Attachment`, which is why footage had nowhere to live.
 *
 * Brand-scoped rather than content-scoped on purpose: the whole point is that
 * something uploaded while editing one post can be used in another.
 */

export type AssetKind = "image" | "video" | "audio";

/** Where an asset came from. These are the library's tabs. */
export type AssetSource = "brand" | "upload" | "stock" | "generated";

export type AssetIngestStatus = "pending" | "done" | "failed";

/** One word of a transcript, and when it was said. */
export interface ITranscriptWord {
    text: string;
    /**
     * Milliseconds into the footage — integers, never the provider's float
     * seconds. Every other time in this product is integer ms, and two units in
     * play is how a trim ends up a thousand times too long.
     */
    startMs: number;
    endMs: number;
    /**
     * word | spacing | audio_event. Spacing is KEPT rather than filtered, so a
     * span deleted from the transcript takes its surrounding silence with it
     * instead of leaving a gap where the pause used to be.
     */
    kind?: string;
}

/** A stretch of footage described in words. */
export interface IShot {
    startMs: number;
    endMs: number;
    /**
     * What a person would say is happening. This is what a request is matched
     * against when something has to choose which part of a take to place.
     */
    description: string;
}

/**
 * What was learned about a video when it arrived.
 *
 * Produced in two halves by two processes: the render worker measures the file
 * and samples frames (ffprobe and ffmpeg live in its container and nowhere
 * else) and writes `status: "pending"`; the backend then transcribes it and
 * describes the frames, and only it writes `"done"`. So a `pending` ingest is
 * normal and in progress, not stuck.
 *
 * A video is usable before any of this finishes — it can be trimmed and placed
 * by hand — so the status gates the smart features, not the footage.
 */
export interface IAssetIngest {
    status: AssetIngestStatus;
    error?: string;

    // ── From ffprobe ──
    durationMs?: number;
    width?: number;
    height?: number;
    fps?: number;
    hasAudio?: boolean;

    /**
     * Evenly spaced stills, in order, sampled at the MIDPOINT of each slice.
     * Kept rather than discarded: they are what a later, better model would
     * re-read, and re-extracting them means downloading the whole video again.
     */
    sampleFrameUrls?: string[];

    /** The transcript with per-word timings, and the same thing as prose. */
    words?: ITranscriptWord[];
    text?: string;

    shots?: IShot[];

    ingestedAt?: number;
}

export interface IAsset {
    id: string;

    kind: AssetKind;
    source: AssetSource;

    url: string;
    /** A small copy for grids; `posterUrl` is a video's first frame. */
    thumbUrl?: string;
    posterUrl?: string;
    mimeType?: string;

    width?: number;
    height?: number;
    durationMs?: number;

    alt?: string;
    title?: string;

    // ── Provenance ──
    // The fields an attachment could never hold.
    /** The mediagen driver or source name ("unsplash", "openrouter"). */
    provider?: string;
    /** The credit line that must travel with the asset. */
    attribution?: string;
    /** Links the creator, referral tag included where one is required. */
    creditUrl?: string;
    /**
     * The URL above is the licensed location and the bytes must NOT be copied.
     * A stock photo is precisely the row that cannot carry a cached copy of
     * itself.
     */
    hotlink?: boolean;
    /** This asset's licence forbids feeding it to a model. */
    noAiInput?: boolean;

    // ── Footage ──
    /** A default in and out point, so a clip starts where the take does. */
    trimInMs?: number;
    trimOutMs?: number;
    /** Absent until ingest runs, and ingest only runs for video. */
    ingest?: IAssetIngest;

    /** Where it first appeared, without the asset belonging to that post. */
    originContentId?: string;
    createdBy?: string;
    createdAt: number;
    updatedAt?: number;

    /**
     * This row is NOT stored — it was reconstructed from a content attachment
     * for the union, and knows nothing except a URL. A caller that wants to
     * edit one has to create a real asset first.
     */
    derived?: boolean;
}
