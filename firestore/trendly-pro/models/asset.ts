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

/**
 * Where a piece of media is in its life.
 *
 * ⚠️ `undefined` MEANS READY. There are rows in production older than this
 * field, and treating a missing status as "not finished uploading" would hide a
 * brand's entire history behind a sweep. Use `isMediaPickable` rather than
 * comparing to "ready" by hand.
 *
 * `pending` exists because a pre-signed upload is filed BEFORE its bytes exist:
 * the backend hands out a URL and never sees the transfer, so the row goes in at
 * hand-out and the app confirms it once its PUT returns.
 */
export type MediaStatus = "pending" | "ready" | "archived" | "failed";

/** What produced a piece of media. */
export type MediaOriginKind =
    | "upload"
    | "generated"
    | "render"
    | "frame"
    | "stock"
    | "hosted";

/**
 * What produced this, in the terms of whatever produced it.
 *
 * It is the first thing a person asks of anything in the library ("where did
 * this come from?") and the first thing the AI needs in order to reuse it ("the
 * still I made of the founder"), which is why it is structured rather than a
 * label.
 */
export interface IMediaOrigin {
    kind: MediaOriginKind;

    /** The generator: "elevenlabs", "veo-3.1-fast-generate-001". */
    provider?: string;
    model?: string;
    /**
     * What it was asked for. The important one for search: a generated clip has
     * no filename anybody chose, so the prompt is the only description
     * attached to it.
     */
    prompt?: string;
    jobId?: string;

    /** The design or composition revision a render came from. */
    revisionId?: string;
    contentId?: string;
    studioId?: string;
    sceneId?: string;

    /**
     * A frame cut out of other media: which media, and how far into it. This
     * is what makes a chain legible weeks later — the start frame of beat 3
     * reads as "media X at 7,920ms" rather than as an anonymous PNG.
     */
    sourceMediaId?: string;
    atMs?: number;

    at?: number;
}

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

    // ── Bytes and lifecycle ─────────────────────────────────────────────────
    // Added when media became a COLLECTION rather than a convenience: every
    // byte that leaves for S3 gets a row whether anything uses it or not, so
    // there is a history to pick from, a reference count that makes deletion
    // safe, and a per-brand byte total that is real on the day storage is ever
    // charged for.
    //
    // All of these are written by the BACKEND ONLY — the collection is not
    // client-writable. A client able to set `sizeBytes` or `refCount` could
    // under-report its storage or strand media that something still uses.

    /** Where the bytes actually are. The URL is a CDN address and cannot be
     * used to measure, re-read or remove an object. */
    s3Bucket?: string;
    s3Key?: string;
    /** Read back from S3 with a HEAD, never taken from the uploader. */
    sizeBytes?: number;

    /** See MediaStatus: absent means ready. */
    status?: MediaStatus;

    /**
     * How many scenes, layers and published contents point at this.
     *
     * What makes "archive, never hard-delete" enforceable: media with a live
     * reference cannot be put away, and media with none can.
     */
    refCount?: number;

    origin?: IMediaOrigin;
    /** The media this was derived from — the clip a frame was cut out of. */
    sourceMediaId?: string;
    archivedAt?: number;
}

/**
 * Whether media can be placed in a scene.
 *
 * ⚠️ Use this instead of `status === "ready"`. A row with no status predates the
 * registry and IS pickable; a strict comparison hides every asset a brand had
 * before the collection shipped.
 */
export function isMediaPickable(a: Pick<IAsset, "status">): boolean {
    return a.status === undefined || a.status === "ready";
}

/** A human-readable size, for the storage figure on settings. */
export function formatMediaBytes(bytes: number): string {
    if (!bytes || bytes < 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
}

/**
 * The per-brand storage rollup — `brands/{brandId}/aggregates/mediaUsage`.
 *
 * Maintained with atomic increments as media is filed and archived, rather than
 * computed on demand: the alternative is walking every row every time anyone
 * opens a settings screen.
 *
 * ⚠️ `bytesTotal` does NOT fall when media is archived. Archived bytes still
 * occupy the bucket; only `countVisible` drops. A figure that fell when a user
 * hid something would under-report what is stored, which is the one direction a
 * billable number must never be wrong in.
 */
export interface IBrandMediaUsage {
    bytesTotal: number;
    countVisible: number;
    bytesByKind?: Partial<Record<AssetKind, number>>;
    updatedAt?: number;
}
