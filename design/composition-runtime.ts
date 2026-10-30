/**
 * composition-runtime — the in-between layer that makes a timeline the
 * primitive and an HTML design just one clip source among several.
 *
 * ONE canonical implementation of "what is on screen at time T of a
 * composition", imported by both sides so they cannot disagree:
 *
 *   • the app's timeline UI, which lays clips out and moves a playhead, and
 *   • the render worker, which turns the timeline into an FFmpeg graph.
 *
 * ── How this relates to design-runtime ──────────────────────────────────────
 * `design-runtime.ts` owns the timeline INSIDE one HTML design: its scenes,
 * their durations, and the overlaps between them. This file owns the timeline
 * ABOVE designs: a sequence of clips, of which a whole design may be one.
 *
 * The two never overlap, and that separation is deliberate. A design clip's
 * internal scene transitions stay entirely inside Chromium, where they already
 * work and are already deterministic; compositing BETWEEN clips happens in
 * FFmpeg. Nothing about adding a timeline changes how a design plays.
 *
 * Unlike design-runtime, nothing here is serialized into a page — these are
 * ordinary modules on both sides — so normal TypeScript is fine. It is kept
 * dependency-free anyway, because the render worker imports it across a
 * submodule boundary with no build step of its own.
 *
 * ── Why clip offsets are DERIVED, not authored ──────────────────────────────
 * `Clip.startMs` is stored, but `measureComposition` recomputes it from the
 * sequence and is the only authority. The stored value is a cache for layout,
 * stamped by whoever persists the composition.
 *
 * Authoring absolute positions instead would admit two states nobody wants: a
 * GAP, which can only render as black and which no user has ever intended, and
 * an OVERLAP that no transition asked for, where two clips claim the same
 * instant and which one wins is a coin flip. Deriving offsets from a contiguous
 * sequence makes both unrepresentable, and it is the same arithmetic
 * design-runtime already uses for scenes — so there is one mental model for
 * "where am I", not two that drift.
 */

/**
 * How a clip enters. Mirrors design-runtime's TransitionKind so a timeline and
 * a design describe a cross-fade the same way; "push" and "slide" are scene
 * effects that have no clip-level equivalent yet and normalize to a cut.
 */
export type CompositionTransitionKind = "cut" | "fade";

export interface CompositionTransition {
    kind: CompositionTransitionKind;
    /** Overlap with the previous clip in ms. Clamped — see measureComposition. */
    ms: number;
}

/** A whole HTML design revision, or one scene of it, played in Chromium. */
export interface DesignClipSource {
    kind: "design";
    revisionId: string;
    /**
     * Render only this scene of the design. Omitted means the whole design,
     * internal scene transitions included — which is what an existing video
     * design becomes, and the case the parity gate is about.
     */
    sceneIndex?: number;
    /**
     * Capture with a transparent background, for an overlay track. Phase 7.
     */
    transparent?: boolean;
}

/** Uploaded or stock video, trimmed and placed. Decoded by FFmpeg, never by Chromium. */
export interface FootageClipSource {
    kind: "footage";
    /** Direct playable url. Required — `assetId` alone cannot be rendered. */
    url: string;
    /** Asset library id, once there is an asset library (Phase 7). */
    assetId?: string;
    /** Trim window into the source, in source time. */
    inMs?: number;
    outMs?: number;
    /** Playback rate. 1 is untouched; 2 is double speed. */
    speed?: number;
    /** 0..1 on the clip's own audio. 0 (default) strips it. */
    volume?: number;
}

/** A generated video. Declared now, rendered once a video model is enabled. */
export interface GenVideoClipSource {
    kind: "genvideo";
    model: string;
    prompt: string;
    startFrameUrl?: string;
    endFrameUrl?: string;
    /** mediagen job id, while the generation is in flight. */
    jobId?: string;
    /** Set once the job has landed; without it the clip cannot render. */
    url?: string;
}

/** A still, optionally with a slow push so it is not visually dead. */
export interface ImageClipSource {
    kind: "image";
    url: string;
    assetId?: string;
    /** Slow zoom. "in" pushes toward the subject, "out" pulls away. */
    kenBurns?: "none" | "in" | "out";
}

export type ClipSource =
    | DesignClipSource
    | FootageClipSource
    | GenVideoClipSource
    | ImageClipSource;

export type ClipSourceKind = ClipSource["kind"];

export interface Clip {
    /** Stable within the composition, so a UI can key and reorder by it. */
    id: string;
    /**
     * Derived cache of where this clip starts on the composition timeline.
     * `measureComposition` is the authority — see the file header.
     */
    startMs?: number;
    /** This clip's own on-screen length in ms. Must be > 0. */
    durationMs: number;
    /** How it enters. Index 0's transition is always a cut. */
    transitionIn?: CompositionTransition;
    source: ClipSource;
}

/**
 * "video" is the picture track; "overlay" composites transparent clips on top
 * of it (Phase 7); "audio" is a placed sound clip, as opposed to the
 * content-level soundtrack that already exists on `content.audio`.
 */
export type TrackKind = "video" | "overlay" | "audio";

export interface Track {
    kind: TrackKind;
    clips: Clip[];
}

export interface Composition {
    width: number;
    height: number;
    fps: number;
    /** Derived cache of the total length. `measureComposition` is the authority. */
    durationMs?: number;
    tracks: Track[];
}

/** One clip resolved onto the composition's clock. */
export interface MeasuredClip {
    clip: Clip;
    index: number;
    startMs: number;
    durationMs: number;
    /** Transition after clamping. `ms` is 0 for a cut and for index 0. */
    transition: CompositionTransition;
}

export interface CompositionMeasurement {
    clips: MeasuredClip[];
    /** Sum of the durations MINUS the overlaps. Nothing should add them up. */
    totalMs: number;
    width: number;
    height: number;
    fps: number;
}

/** A clip with no duration of its own falls back to this, matching a design scene. */
export const DEFAULT_CLIP_MS = 3000;
/** A declared fade with no length of its own, matching design-runtime. */
export const DEFAULT_TRANSITION_MS = 400;

/** The picture track. There is at most one; anything else is a validation error. */
export function videoTrack(composition: Composition): Track | null {
    const tracks = composition.tracks || [];
    for (const t of tracks) if (t.kind === "video") return t;
    return null;
}

export function tracksOfKind(composition: Composition, kind: TrackKind): Track[] {
    return (composition.tracks || []).filter((t) => t.kind === kind);
}

/**
 * Resolve every clip onto the composition's clock.
 *
 * The clamp is the part worth reading, and it is design-runtime's rule
 * transplanted: an overlap may never exceed HALF of the shorter of the two
 * clips it joins. Without it a transition longer than the outgoing clip would
 * push the next clip's start back past it, offsets would stop increasing, and
 * "which clip is at time T" would become a coin flip. Half is also roughly
 * where a cross-fade stops reading as a transition and starts reading as a
 * mistake.
 */
export function measureComposition(composition: Composition): CompositionMeasurement {
    const track = videoTrack(composition);
    const clips = track ? track.clips || [] : [];

    const durations: number[] = [];
    const transitions: CompositionTransition[] = [];
    for (let i = 0; i < clips.length; i++) {
        const raw = Math.round(Number(clips[i].durationMs));
        durations.push(Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CLIP_MS);

        const declared = clips[i].transitionIn;
        const kind: CompositionTransitionKind = declared && declared.kind === "fade" ? "fade" : "cut";
        let ms = 0;
        if (kind === "fade" && i > 0) {
            const declaredMs = Math.round(Number(declared?.ms));
            ms = Number.isFinite(declaredMs) && declaredMs > 0 ? declaredMs : DEFAULT_TRANSITION_MS;
            const half = Math.floor(Math.min(durations[i - 1], durations[i]) / 2);
            if (ms > half) ms = half;
        }
        transitions.push({ kind: i === 0 ? "cut" : kind, ms });
    }

    const measured: MeasuredClip[] = [];
    let cursor = 0;
    for (let i = 0; i < clips.length; i++) {
        const startMs = i === 0 ? 0 : cursor - transitions[i].ms;
        measured.push({
            clip: clips[i],
            index: i,
            startMs,
            durationMs: durations[i],
            transition: transitions[i],
        });
        cursor = startMs + durations[i];
    }

    return {
        clips: measured,
        totalMs: measured.length ? cursor : 0,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
    };
}

/** Which clip is on screen at `ms`. -1 when the composition is empty. */
export function clipAt(measurement: CompositionMeasurement, ms: number): number {
    let idx = -1;
    for (const c of measurement.clips) {
        if (ms >= c.startMs) idx = c.index;
        else break;
    }
    return idx;
}

/**
 * Restamp the derived caches (`Clip.startMs`, `Composition.durationMs`) from a
 * fresh measurement. Whoever persists a composition calls this, so the stored
 * numbers can never contradict the runtime's arithmetic.
 */
export function withDerivedOffsets(composition: Composition): Composition {
    const m = measureComposition(composition);
    const byIndex = new Map(m.clips.map((c) => [c.clip, c]));
    return {
        ...composition,
        durationMs: m.totalMs,
        tracks: (composition.tracks || []).map((t) =>
            t.kind !== "video"
                ? t
                : {
                      ...t,
                      clips: (t.clips || []).map((clip) => {
                          const measured = byIndex.get(clip);
                          return measured ? { ...clip, startMs: measured.startMs } : clip;
                      }),
                  }
        ),
    };
}

/**
 * The parity predicate, and the reason it exists.
 *
 * A composition that is exactly one whole design and nothing else describes
 * precisely what every video design was before there were compositions. When
 * this returns a source, the renderer must take the pre-composition code path
 * verbatim rather than a general one that happens to agree — a concat or an
 * intermediate re-encode of a single clip would be a second generation of lossy
 * video, so the output would be *equivalent* but not *identical*, and "byte
 * identical" is the acceptance test for this phase.
 *
 * Returns null the moment anything else is going on.
 */
export function singleDesignPassthrough(composition: Composition): DesignClipSource | null {
    const tracks = composition.tracks || [];
    const video = tracks.filter((t) => t.kind === "video");
    if (video.length !== 1) return null;
    // An empty track of another kind is fine; a clip on one is not.
    for (const t of tracks) {
        if (t.kind !== "video" && (t.clips || []).length > 0) return null;
    }

    const clips = video[0].clips || [];
    if (clips.length !== 1) return null;

    const clip = clips[0];
    if (clip.transitionIn && clip.transitionIn.kind !== "cut" && clip.transitionIn.ms > 0) return null;

    const source = clip.source;
    if (!source || source.kind !== "design") return null;
    if (source.sceneIndex !== undefined && source.sceneIndex !== null) return null;
    if (source.transparent) return null;
    return source;
}

/**
 * Build the implicit composition for a content that has a design and no
 * timeline of its own.
 *
 * This is the adapter that lets every pre-existing video design render THROUGH
 * the composition path without a migration and without a UI change: the
 * timeline becomes the primitive everywhere, and the single-design case is a
 * passthrough rather than a special case bolted beside it.
 */
export function compositionFromDesign(args: {
    revisionId: string;
    width: number;
    height: number;
    fps: number;
    durationMs: number;
}): Composition {
    const durationMs = args.durationMs > 0 ? args.durationMs : DEFAULT_CLIP_MS;
    return withDerivedOffsets({
        width: args.width,
        height: args.height,
        fps: args.fps,
        tracks: [
            {
                kind: "video",
                clips: [
                    {
                        id: "design",
                        durationMs,
                        source: { kind: "design", revisionId: args.revisionId },
                    },
                ],
            },
        ],
    });
}

export interface CompositionProblem {
    /** Dotted path to the offending field, for a UI that wants to point at it. */
    path: string;
    message: string;
    /** A fatal problem means the composition cannot be rendered at all. */
    fatal: boolean;
}

/**
 * Check a composition before anything spends money on it.
 *
 * Fatal problems are the ones where rendering would either crash or quietly
 * produce something the user did not ask for — a missing url, a clip of no
 * length, a source nothing can render yet. Non-fatal ones are reported so a UI
 * can warn, but a render still proceeds.
 */
export function validateComposition(composition: Composition): CompositionProblem[] {
    const problems: CompositionProblem[] = [];
    const push = (path: string, message: string, fatal = true) =>
        problems.push({ path, message, fatal });

    if (!(composition.width > 0) || !(composition.height > 0)) {
        push("size", "A composition needs a positive width and height.");
    }
    if (!(composition.fps > 0) || composition.fps > 60) {
        push("fps", "Frame rate must be between 1 and 60.");
    }

    const tracks = composition.tracks || [];
    const video = tracks.filter((t) => t.kind === "video");
    if (video.length === 0) push("tracks", "A composition needs a video track.");
    if (video.length > 1) push("tracks", "A composition can only have one video track.");

    for (const t of tracksOfKind(composition, "overlay")) {
        if ((t.clips || []).length > 0) {
            push("tracks.overlay", "Overlay tracks aren't supported yet.");
        }
    }
    for (const t of tracksOfKind(composition, "audio")) {
        if ((t.clips || []).length > 0) {
            push("tracks.audio", "Placed audio clips aren't supported yet.");
        }
    }

    const clips = video.length === 1 ? video[0].clips || [] : [];
    if (video.length === 1 && clips.length === 0) {
        push("tracks.video.clips", "A composition needs at least one clip.");
    }

    const seen = new Set<string>();
    clips.forEach((clip, i) => {
        const at = `tracks.video.clips[${i}]`;
        if (!clip.id) push(`${at}.id`, "Every clip needs an id.");
        else if (seen.has(clip.id)) push(`${at}.id`, `Duplicate clip id "${clip.id}".`);
        else seen.add(clip.id);

        if (!(clip.durationMs > 0)) push(`${at}.durationMs`, "A clip needs a duration.");

        const source = clip.source;
        if (!source || !source.kind) {
            push(`${at}.source`, "A clip needs a source.");
            return;
        }
        switch (source.kind) {
            case "design":
                if (!source.revisionId) push(`${at}.source.revisionId`, "A design clip needs a revision.");
                if (source.sceneIndex !== undefined && !(source.sceneIndex >= 0)) {
                    push(`${at}.source.sceneIndex`, "A scene index can't be negative.");
                }
                if (source.transparent) {
                    push(`${at}.source.transparent`, "Transparent design clips aren't supported yet.");
                }
                break;
            case "footage":
                if (!source.url) push(`${at}.source.url`, "A footage clip needs a url.");
                if (source.speed !== undefined && !(source.speed > 0)) {
                    push(`${at}.source.speed`, "Speed must be greater than zero.");
                }
                if (
                    source.inMs !== undefined &&
                    source.outMs !== undefined &&
                    source.outMs <= source.inMs
                ) {
                    push(`${at}.source.outMs`, "A trim must end after it starts.");
                }
                break;
            case "image":
                if (!source.url) push(`${at}.source.url`, "An image clip needs a url.");
                break;
            case "genvideo":
                // Not fatal-by-kind but fatal-in-practice: a clip still waiting
                // on its generation has nothing to render, and saying so beats
                // encoding a black gap where the shot should be.
                if (!source.url) {
                    push(
                        `${at}.source.url`,
                        "This generated clip hasn't finished yet, so it can't be rendered."
                    );
                }
                break;
            default:
                push(`${at}.source.kind`, `Unknown clip source "${(source as { kind: string }).kind}".`);
        }

        const t = clip.transitionIn;
        if (t && t.kind === "fade" && i === 0) {
            push(`${at}.transitionIn`, "The first clip can't fade in from anything.", false);
        }
    });

    return problems;
}

/** True when nothing fatal stands between this composition and a render. */
export function isRenderable(composition: Composition): boolean {
    return !validateComposition(composition).some((p) => p.fatal);
}
