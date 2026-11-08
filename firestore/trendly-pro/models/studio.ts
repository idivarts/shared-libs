/**
 * The Design Studio's documents.
 *
 *   brands/{brandId}/contents/{contentId}/studios/{studioId}
 *   brands/{brandId}/contents/{contentId}/studios/{studioId}/scenes/{sceneId}
 *   brands/{brandId}/contents/{contentId}/studios/{studioId}/renders/{renderId}
 *   brands/{brandId}/contents/{contentId}/studios/{studioId}/runs/{runId}
 *
 * Mirrors `backend-sls/internal/models/trendlymodels/studio*.go`. Change one,
 * change both.
 *
 * ── Why this replaces the old studio ────────────────────────────────────────
 * The old one kept a whole design as ONE HTML document whose slides were
 * `[data-slide]` children, and a separate composition timeline of clips. Two
 * structures both claimed to say what "scene 3" was, and a scene was only a DOM
 * node — so it could not be regenerated on its own, could not carry its own
 * duration or transition, and could not be anything other than HTML.
 *
 * Here A SCENE IS A DOCUMENT. That one change is what makes every feature in
 * the plan expressible: a scene can be regenerated alone because it is a row; it
 * can be a video or an image or HTML because its layers say which; it can be
 * reordered without rewriting anything else because ORDER LIVES IN ONE PLACE —
 * `sceneOrder` on the studio.
 *
 * ⚠️ `sceneOrder` IS THE AUTHORITY ON ORDER. A scene's `index` is a cache for
 * sorting a query result and nothing more. Two places that both claim to know
 * the order is the exact bug this rebuild exists to remove, so when they
 * disagree, `sceneOrder` wins and `index` is wrong.
 */

import { IAsset } from "./asset";

// ─────────────────────────── Scenes and sources ───────────────────────────

/**
 * What fills a scene.
 *
 * `motion` is HTML/CSS animation — the scene owns its own document, which is
 * what lets one scene be regenerated without touching its neighbours.
 * `composite` is also an HTML document, but one that places images and elements
 * on a canvas to be rendered as a STILL. It is a separate kind from `motion`
 * rather than a flag on it because the renderer treats them differently (one
 * captures frames, the other captures once) and because the AI plans them
 * differently.
 * `empty` is a deliberate placeholder — a gap someone has left on the timeline
 * on purpose. It is NOT a broken scene, and the rail must not nag about it.
 */
export type SceneSource = "motion" | "composite" | "video" | "image" | "empty";

/**
 * Where a layer sits.
 *
 * Named slots rather than coordinates, and that is a deliberate restriction on
 * what the AI can ask for. A planner given x/y/w/h produces layouts that are
 * subtly wrong at a different aspect ratio and impossible to reason about; a
 * planner given "left half" produces a split screen that works at every size.
 *
 * `pip-*` is picture-in-picture, named by corner: `pip-br` is bottom right.
 * `custom` exists for a human dragging a layer, and the planner is not allowed
 * to choose it.
 */
export type LayerSlot =
    | "full"
    | "left"
    | "right"
    | "top"
    | "bottom"
    | "q1"
    | "q2"
    | "q3"
    | "q4"
    | "pip-tl"
    | "pip-tr"
    | "pip-bl"
    | "pip-br"
    | "lower-third"
    | "custom";

/** A layer is either a piece of media or a document. */
export type LayerKind = "media" | "html";

/** How media fills its slot. */
export type LayerFit = "cover" | "contain";

/**
 * A rectangle in FRACTIONS of the canvas (0..1), for `slot: "custom"` only.
 *
 * Fractions rather than pixels so a layer survives the canvas changing size —
 * a 9:16 reel re-cut as a 1:1 post keeps its composition instead of placing a
 * caption off-screen.
 */
export interface ILayerRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** A slow push or pan across a still, to stop it reading as a dead frame. */
export interface IKenBurns {
    /** Start and end scale, e.g. 1 → 1.08 for a gentle push in. */
    fromScale: number;
    toScale: number;
    /** Fractional origin the zoom moves toward; defaults to the centre. */
    originX?: number;
    originY?: number;
}

/**
 * One layer of a scene.
 *
 * Most scenes have exactly one, and that is the point of modelling a stack at
 * all: "two clips side by side with type over them" is three layers of one
 * scene, not three scenes. A scene is a MOMENT; the stack is what is visible
 * during it.
 */
export interface IStudioLayer {
    id: string;
    kind: LayerKind;
    slot: LayerSlot;
    /** Only read when `slot` is "custom". */
    rect?: ILayerRect;

    /** For `kind: "media"` — a row in the brand's media library. */
    mediaId?: string;
    /**
     * For `kind: "html"` — the document for this layer.
     *
     * Kept on the layer rather than in a subcollection because a scene is
     * already a document: nesting one more level buys nothing and costs a read
     * on every scene the rail draws.
     */
    html?: string;

    /** Trim of the SOURCE media, in source time. */
    trimInMs?: number;
    trimOutMs?: number;

    /** 0..1. A layer under a voiceover is ducked, not silenced. */
    volume?: number;
    /** 1 is normal. Applies to video only. */
    speed?: number;
    fit?: LayerFit;
    opacity?: number;
    kenBurns?: IKenBurns;

    /**
     * A still image layer's own animation length is the scene's; a video
     * layer shorter than the scene FREEZES on its last frame rather than
     * cutting to black, because black mid-scene reads as a bug and a freeze
     * reads as a choice.
     */
    freezeOnEnd?: boolean;
}

// ─────────────────────────────── Transitions ───────────────────────────────

/**
 * How one scene becomes the next.
 *
 * `cut` is the default and costs nothing. Everything else CONSUMES TIME from
 * both neighbours — see `ITransition.durationMs`.
 */
export type TransitionKind =
    | "cut"
    | "dissolve"
    | "dip"
    | "slide"
    | "wipe"
    | "blur-dissolve"
    | "whip";

/**
 * A document-level choice that makes a generated timeline look deliberate
 * instead of like seven unrelated decisions.
 *
 * This matters more than the individual kinds: a plan that picks a different
 * transition per boundary looks like a slideshow template, and one preset
 * applied throughout looks like an edit.
 */
export type TransitionPreset = "none" | "snappy" | "soft" | "graphic" | "energetic";

export interface ITransition {
    kind: TransitionKind;
    /**
     * How long the overlap lasts.
     *
     * ⚠️ IT IS AN OVERLAP, NOT A GAP. A 400ms dissolve takes 200ms off the end
     * of the outgoing scene and 200ms off the start of the incoming one, so the
     * timeline gets SHORTER as transitions are added. Clamped to half the
     * shorter neighbour, because a transition longer than the scene it is
     * dissolving out of has nothing left to dissolve.
     */
    durationMs: number;
    /** For `slide` and `wipe`. */
    direction?: "left" | "right" | "up" | "down";
}

// ────────────────────────────── Narration ──────────────────────────────────

/**
 * Where a narrated line came from.
 *
 * ⚠️ This is ENFORCEMENT, not metadata. Trendly's first brand rule is that a
 * claim has to be one we can stand behind, and a planner asked for a hooky
 * opener will otherwise write a confident sentence nobody approved. Inferring
 * provenance from the text is too brittle and a planner allowed only to quote
 * writes worse timing — so the planner DECLARES where each line came from and
 * the validator checks the declaration against the material it was given.
 *
 * `illustrative` is allowed, and is the honest label for an invented scenario.
 * It costs the scene an on-screen marker saying so.
 */
export type NarrationSource =
    | "script"
    | "caption"
    | "brand"
    | "paraphrase"
    | "illustrative";

export interface ISceneNarration {
    line: string;
    source: NarrationSource;
    /** For `source: "brand"` — which brand fact. */
    brandFactId?: string;
    /**
     * Stretch the scene to fit the spoken line.
     *
     * Speech runs at roughly 14 characters a second. With this off, a line that
     * cannot be said inside the scene is REFUSED rather than allowed to overrun
     * the picture — which is the commonest way a render comes out wrong.
     */
    fitToNarration?: boolean;
    /** The generated audio, once it exists. */
    mediaId?: string;
    /** Where in the scene the line starts. */
    offsetMs?: number;
}

// ────────────────────────────── Generation ─────────────────────────────────

/** How a scene's media was generated, when it was. */
export interface ISceneGeneration {
    model: string;
    prompt: string;
    /** Model-specific request fields, kept verbatim for a faithful retry. */
    params?: Record<string, unknown>;
    jobId?: string;
    status?: "queued" | "running" | "done" | "failed";
    error?: string;

    /**
     * This scene continues the previous one as one unbroken motion, and was
     * generated from its last frame.
     *
     * ⚠️ A CHAIN IS NOT A WAY TO HOLD A FACE across separate beats. It only
     * makes sense when the two scenes are genuinely the same instant carrying
     * on — otherwise the second clip inherits the first's exact framing and the
     * cut reads as a glitch rather than a new shot. For a person appearing in
     * two different moments, use a cast anchor.
     */
    chainedFromSceneId?: string;
    /** The still handed to the model as its opening image. */
    startFrameMediaId?: string;
    /** Media referenced for likeness — a cast member's anchor still. */
    referenceMediaIds?: string[];

    castIds?: string[];
    locationId?: string;
}

// ─────────────────────── Cast, locations and anchors ───────────────────────

/**
 * A person who appears in more than one generated clip.
 *
 * The whole mechanism for keeping a face the same. Three things make it work
 * and all three are here:
 *
 *  - `anchorMediaId` is ONE APPROVED STILL. Every clip that includes this
 *    person references it, so each clip is generated from the same face rather
 *    than from the previous clip's interpretation of a description.
 *  - `look` is appended VERBATIM to every prompt. Paraphrasing the wardrobe
 *    between clips is how a navy jumper becomes a blue shirt.
 *  - `description` is for the person reading the plan, not for the model.
 */
export interface ICastMember {
    id: string;
    description: string;
    /** Appended verbatim to every prompt this person appears in. */
    look: string;
    anchorMediaId?: string;
    /** One voice per document, but recorded here when the cast member speaks. */
    voiceId?: string;
}

/** A place that appears in more than one generated clip. Same rule as cast. */
export interface IStudioLocation {
    id: string;
    description: string;
    look: string;
    anchorMediaId?: string;
}

// ──────────────────────────────── Audio ────────────────────────────────────

export type AudioLaneKind = "music" | "voiceover" | "sfx";

/**
 * One piece of audio on the document.
 *
 * ⚠️ A VOICEOVER IS ANCHORED TO A SCENE, not to an absolute millisecond.
 * `{ sceneId, offsetMs }` survives reorder, split and retime; an absolute start
 * does not — and reordering scenes is the single most common edit in the rail,
 * so absolute times would desynchronise the voice from the picture on the first
 * drag. Music is the exception: a bed genuinely belongs to the whole document
 * and starts at zero.
 */
export interface IAudioLane {
    id: string;
    kind: AudioLaneKind;
    mediaId: string;

    /** Music only: runs from the top of the document. */
    fromStart?: boolean;
    /** Voiceover and sfx: anchored to a scene. */
    sceneId?: string;
    offsetMs?: number;

    /** 0..1. */
    volume?: number;
    /**
     * Duck the music under this lane. On by default for voiceover, because a
     * bed at full level under a voice is the single commonest reason a render
     * sounds amateur.
     */
    duckMusic?: boolean;
    fadeInMs?: number;
    fadeOutMs?: number;
    trimInMs?: number;
    trimOutMs?: number;
}

/**
 * A music bed the director planned that nobody has applied yet.
 *
 * ── Why a plan's music waits instead of landing ─────────────────────────────
 * Approving a storyboard must not spend money or overwrite sound on its own.
 * Generating a bed is a metered call the user has not made, and a studio being
 * approved onto may already have a bed the user chose — a second one, or a
 * silent replacement, is worse than an offer. So the plan's intent is parked
 * here and the sound panel offers it in one tap.
 *
 * ── Why it is not simply dropped ────────────────────────────────────────────
 * It used to be, and the plan's music was the one part hardest to re-describe:
 * "32 seconds, builds at 0:18" is a judgement about the edit, not a preference
 * someone can retype from memory.
 *
 * `reuse` waits too, even though a library row costs nothing, because the
 * reason to wait is the existing bed rather than the price.
 */
export interface IMusicRequest {
    /** `generate` costs money when applied; `reuse` names a row already owned. */
    approach: "generate" | "reuse";
    /** For `generate` — a `mediaModels` document id, which IS the provider's model id. */
    modelId?: string;
    /** For `generate` — what the bed should be, including where it builds. */
    prompt?: string;
    /** For `reuse` — the library row to put on the music lane. */
    mediaId?: string;
    /** Set when the user declines, so it stops being offered without being lost. */
    dismissed?: boolean;
}

export interface IStudioAudio {
    lanes: IAudioLane[];
    /**
     * ONE voice for the whole document.
     *
     * Not a per-scene choice, because two voices across a 30-second reel reads
     * as two different videos spliced together. A second speaker is a
     * deliberate exception, and it belongs on the cast member.
     */
    voiceId?: string;
    /** What the director asked for, pending a tap. See `IMusicRequest`. */
    musicRequest?: IMusicRequest;
}

// ────────────────────────────── The documents ──────────────────────────────

/** The format a studio is authoring for. Mirrors the content types. */
export type StudioFormat = "reel" | "video" | "post" | "carousel" | "story";

export interface IStudioScene {
    id: string;

    /**
     * What this scene is, derived from `layers[0]`.
     *
     * Stored rather than computed so the rail can draw a scene without
     * resolving its media, and so a query can filter on it. `layers[0]` is the
     * authority; this is a cache, like `index`.
     */
    primaryKind: SceneSource;

    /**
     * How long this scene is on screen, BEFORE transitions take their overlap
     * and before narration stretches it. The effective length is computed, not
     * stored — see `measureStudio`.
     */
    durationMs: number;

    /** How this scene arrives. Lives on the INCOMING scene. */
    transitionIn?: ITransition;

    layers: IStudioLayer[];

    /**
     * Everything any layer references.
     *
     * Duplicated out of the layers so a reference count can be adjusted
     * without walking the stack, and so a scene delete knows what to
     * decrement in one read.
     */
    mediaIds: string[];

    narration?: ISceneNarration;
    gen?: ISceneGeneration;

    /** A cache of this scene's position. `sceneOrder` is the authority. */
    index?: number;

    /** A short label shown on the rail. */
    title?: string;
    /** Set while a generation is in flight, so the rail can show a placeholder. */
    pending?: boolean;

    createdAt: number;
    updatedAt?: number;
}

export interface IStudio {
    id: string;

    format: StudioFormat;
    width: number;
    height: number;
    fps: number;

    /** THE authority on order. */
    sceneOrder: string[];

    audio?: IStudioAudio;
    transitionPreset?: TransitionPreset;

    cast?: ICastMember[];
    locations?: IStudioLocation[];

    /** The last render of this studio, if any. */
    renderId?: string;
    renderUrl?: string;
    renderStatus?: "queued" | "rendering" | "done" | "failed";
    /**
     * Why a render failed, as a sentence.
     *
     * On the document rather than only in a log, because the app subscribes
     * here and "it didn't work" with no reason is the least actionable thing a
     * screen can say.
     */
    renderError?: string;
    /** What the wallet paid, so a retry does not charge twice. */
    renderChargedTokens?: number;

    createdAt: number;
    updatedAt?: number;
    createdBy?: string;
}

/**
 * The pointer on the content document.
 *
 * Cached counts so a calendar card can say "6 scenes · 24s" without reading the
 * scenes. ⚠️ Cached, therefore not authoritative: anything that CHARGES or
 * PUBLISHES recomputes from the scenes, because this one is client-writable.
 */
export interface IStudioRef {
    studioId: string;
    sceneCount: number;
    durationMs: number;
    renderUrl?: string;
    updatedAt: number;
}

// ───────────────────────────── Scene helpers ───────────────────────────────

/** The scenes of a studio, in order, skipping ids that no longer resolve. */
export function orderedScenes(
    studio: Pick<IStudio, "sceneOrder">,
    scenes: Record<string, IStudioScene>
): IStudioScene[] {
    const out: IStudioScene[] = [];
    for (const id of studio.sceneOrder ?? []) {
        const s = scenes[id];
        if (s) out.push(s);
    }
    // A scene that exists but is not in sceneOrder is a write that half
    // landed. Appending it is better than hiding it: the user can see it and
    // delete it, where a hidden scene is a document nobody can reach.
    for (const id of Object.keys(scenes)) {
        if (!(studio.sceneOrder ?? []).includes(id)) out.push(scenes[id]);
    }
    return out;
}

/** The media a scene's layers reference, deduplicated. */
export function sceneMediaIds(scene: Pick<IStudioScene, "layers">): string[] {
    const seen = new Set<string>();
    for (const l of scene.layers ?? []) {
        if (l.mediaId) seen.add(l.mediaId);
    }
    return [...seen];
}

/** What a scene IS, from its stack. `layers[0]` decides. */
export function derivePrimaryKind(
    scene: Pick<IStudioScene, "layers">,
    media?: Record<string, Pick<IAsset, "kind">>
): SceneSource {
    const first = (scene.layers ?? [])[0];
    if (!first) return "empty";
    if (first.kind === "html") {
        // A document that animates is motion; one that does not is a
        // composite still. The scene cannot tell on its own, so the caller
        // that wrote the HTML records which it made.
        return "motion";
    }
    const kind = first.mediaId ? media?.[first.mediaId]?.kind : undefined;
    if (kind === "video") return "video";
    if (kind === "image") return "image";
    return first.mediaId ? "image" : "empty";
}

/**
 * Speech runs at roughly this many characters a second.
 *
 * A measured-enough average for English at a natural pace. It is used to refuse
 * a line that cannot be said inside its scene, so erring slightly FAST would
 * let overruns through — which is why it is not higher.
 */
export const SPEECH_CHARS_PER_SECOND = 14;

/** A short tail so a line does not end exactly on the cut. */
export const NARRATION_TAIL_MS = 300;

/** How long a line takes to say. */
export function narrationMs(line: string): number {
    const chars = (line ?? "").trim().length;
    if (!chars) return 0;
    return Math.round((chars / SPEECH_CHARS_PER_SECOND) * 1000) + NARRATION_TAIL_MS;
}

/**
 * A scene's length once narration has had its say.
 *
 * `fitToNarration` stretches the scene to hold the line. Without it, the stored
 * duration stands and an over-long line is a validation failure rather than a
 * silent overrun.
 */
export function effectiveSceneMs(scene: IStudioScene): number {
    const base = Math.max(0, scene.durationMs ?? 0);
    const n = scene.narration;
    if (!n?.line || !n.fitToNarration) return base;
    return Math.max(base, narrationMs(n.line) + (n.offsetMs ?? 0));
}

/**
 * The studio's real length, and each scene's place on the timeline.
 *
 * ⚠️ TRANSITIONS SHORTEN THE TIMELINE. Each one overlaps its two neighbours by
 * half its duration, so the total is the sum of the scenes MINUS every overlap.
 * Getting this backwards produces a timeline that drifts longer with every
 * dissolve, and a render whose audio no longer lines up with its picture.
 */
export function measureStudio(
    studio: Pick<IStudio, "sceneOrder">,
    scenes: Record<string, IStudioScene>
): { totalMs: number; starts: Record<string, number>; scenes: IStudioScene[] } {
    const ordered = orderedScenes(studio, scenes);
    const starts: Record<string, number> = {};
    let cursor = 0;

    ordered.forEach((scene, i) => {
        const overlap = i === 0 ? 0 : transitionOverlapMs(ordered[i - 1], scene);
        cursor = Math.max(0, cursor - overlap);
        starts[scene.id] = cursor;
        cursor += effectiveSceneMs(scene);
    });

    return { totalMs: cursor, starts, scenes: ordered };
}

/**
 * How much time a transition takes off the boundary between two scenes.
 *
 * Clamped to half the SHORTER neighbour: a 1s dissolve between two 600ms scenes
 * would otherwise consume more than exists, and the clamp is what stops a
 * generated timeline from collapsing when the planner asks for a long,
 * cinematic cross-fade between two quick beats.
 */
export function transitionOverlapMs(previous: IStudioScene, incoming: IStudioScene): number {
    const t = incoming.transitionIn;
    if (!t || t.kind === "cut" || !(t.durationMs > 0)) return 0;
    const shorter = Math.min(effectiveSceneMs(previous), effectiveSceneMs(incoming));
    return Math.min(t.durationMs, Math.floor(shorter / 2));
}

/** Default scene length per format, used when a scene is added by hand. */
export function defaultSceneMs(format: StudioFormat): number {
    switch (format) {
        case "reel":
        case "story":
            return 3000;
        case "video":
            return 5000;
        default:
            // A carousel scene has no clock at all; the number is only here so
            // nothing divides by zero.
            return 0;
    }
}

/** Whether this format plays on a timeline or is paged through. */
export function isTimedFormat(format: StudioFormat): boolean {
    return format === "reel" || format === "video" || format === "story";
}
