/**
 * The generative-media capability registry — `mediaModels/{modelId}`.
 *
 * Mirrors `backend-sls/internal/models/trendlymodels/media_model.go`. Read by
 * the app, never written by it: the collection is a Firestore document rather
 * than a Go constant because "which models can we use and what can each do" is
 * the fastest-moving fact in this product — models appear and retire on weeks
 * of notice — so enabling one is a field edit instead of a deploy.
 *
 * The capability flags are why the app reads it at all. A video model that
 * cannot take an end frame must not be offered an end-frame slot, and a
 * 30-second request to a model capped at 8 is refused rather than clamped: the
 * user pays for what comes back either way, so a control that promises
 * something the model ignores costs real money.
 *
 * ⚠️ Two things to carry into any UI built on this:
 *  - `enabled` is a REVIEW GATE, not a feature flag. The catalog sync inserts
 *    newly published models with `enabled: false` and never flips it, so an
 *    empty list is the normal state for a workspace where nothing has been
 *    enabled — it means "not available to you", not "something is broken".
 *  - `estUsdPerSecond` / `estUsdPerCall` are PROVISIONAL for every row.
 *    Per-model cost is not published by the providers, so anything user-facing
 *    that quotes a price has to say so.
 */

/**
 * What a model makes. "stt" is speech-to-text — the odd one out, because it
 * CONSUMES media rather than producing it, and it is in the registry for the
 * same reason as the rest: the model id is a provider detail that changes
 * without us, and footage ingest should not need a deploy to follow it.
 */
export type MediaModelKind =
    | "image"
    | "video"
    | "music"
    | "voice"
    | "stt"
    | "stock";

export interface IMediaModel {
    id: string;

    /** The mediagen driver that serves it ("elevenlabs", "openrouter", "pexels"). */
    provider: string;
    displayName: string;
    kind: MediaModelKind;

    // Capabilities. Absent means false, which is the safe answer: a model we
    // have not described cannot be offered a feature it may not have.
    startFrame?: boolean;
    endFrame?: boolean;
    imageRefs?: boolean;
    videoRefs?: boolean;
    sourceVideo?: boolean;
    nativeAudio?: boolean;

    minDurationS?: number;
    maxDurationS?: number;
    /**
     * The EXACT lengths this model accepts, when it accepts a set rather than
     * a range.
     *
     * Veo takes 4, 6 or 8 seconds and refuses 5 with a 422 — bounds of 4–8
     * cannot express that, so a composer deriving its chips from the range
     * offered a value the provider would always reject. Absent means the range
     * is the truth, which is the ordinary case.
     */
    durationsS?: number[];
    resolutions?: string[];
    aspectRatios?: string[];

    estUsdPerSecond?: number;
    estUsdPerCall?: number;

    /** Gates the model to a plan. Mirrors the backend's plan values. */
    minPlan?: string;

    enabled: boolean;

    createdAt?: number;
    updatedAt?: number;
}
