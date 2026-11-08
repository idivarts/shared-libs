/**
 * Studio geometry and transition rules, shared by the preview and the renderer.
 *
 * ⚠️ THIS FILE IS IMPORTED BY THE RENDER WORKER. It is the reason a split screen
 * looks the same in the app as it does in the exported MP4. Anything that
 * decides WHERE a layer sits or HOW LONG a transition lasts belongs here and
 * nowhere else — the moment the preview computes a slot one way and the worker
 * another, the thing the user approved is not the thing that publishes.
 *
 * Keep it dependency-free for the same reason `composition-runtime` is: it runs
 * in React Native, in a browser, and in the worker's Node process.
 */

import type { LayerSlot, TransitionKind, TransitionPreset } from "../firestore/trendly-pro/models/studio";

/** A rectangle in fractions of the canvas. */
export interface SlotRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/**
 * How wide a picture-in-picture inset is, as a fraction of the canvas.
 *
 * A third. Smaller and a face in it is unreadable on a phone; larger and it
 * stops being an inset and starts competing with what it is sitting on.
 */
const PIP_SIZE = 1 / 3;

/** The inset's margin from the edge, so it does not touch the frame. */
const PIP_MARGIN = 0.04;

/**
 * A lower third occupies the bottom quarter, not the bottom third.
 *
 * The name is the broadcast convention; the geometry is what actually reads on
 * a 9:16 phone screen, where a true bottom third covers a standing figure's
 * waist and the platform's own UI already eats the last 10%.
 */
const LOWER_THIRD_HEIGHT = 0.25;
const LOWER_THIRD_BOTTOM_INSET = 0.12;

/**
 * Where a named slot sits on the canvas.
 *
 * Named slots rather than coordinates is a deliberate restriction on what the
 * AI may ask for: a planner given x/y/w/h produces layouts that are subtly
 * wrong at a different aspect ratio and impossible to reason about, where one
 * given "left half" produces a split screen that works at every size.
 *
 * `custom` has no geometry of its own — the layer carries its own rectangle,
 * and only a human dragging a layer may use it.
 */
export function slotRect(slot: LayerSlot, custom?: SlotRect): SlotRect {
    switch (slot) {
        case "full":
            return { x: 0, y: 0, w: 1, h: 1 };
        case "left":
            return { x: 0, y: 0, w: 0.5, h: 1 };
        case "right":
            return { x: 0.5, y: 0, w: 0.5, h: 1 };
        case "top":
            return { x: 0, y: 0, w: 1, h: 0.5 };
        case "bottom":
            return { x: 0, y: 0.5, w: 1, h: 0.5 };
        case "q1":
            return { x: 0, y: 0, w: 0.5, h: 0.5 };
        case "q2":
            return { x: 0.5, y: 0, w: 0.5, h: 0.5 };
        case "q3":
            return { x: 0, y: 0.5, w: 0.5, h: 0.5 };
        case "q4":
            return { x: 0.5, y: 0.5, w: 0.5, h: 0.5 };
        case "pip-tl":
            return { x: PIP_MARGIN, y: PIP_MARGIN, w: PIP_SIZE, h: PIP_SIZE };
        case "pip-tr":
            return { x: 1 - PIP_SIZE - PIP_MARGIN, y: PIP_MARGIN, w: PIP_SIZE, h: PIP_SIZE };
        case "pip-bl":
            return { x: PIP_MARGIN, y: 1 - PIP_SIZE - PIP_MARGIN, w: PIP_SIZE, h: PIP_SIZE };
        case "pip-br":
            return {
                x: 1 - PIP_SIZE - PIP_MARGIN,
                y: 1 - PIP_SIZE - PIP_MARGIN,
                w: PIP_SIZE,
                h: PIP_SIZE,
            };
        case "lower-third":
            return {
                x: 0,
                y: 1 - LOWER_THIRD_HEIGHT - LOWER_THIRD_BOTTOM_INSET,
                w: 1,
                h: LOWER_THIRD_HEIGHT,
            };
        case "custom":
            return custom ?? { x: 0, y: 0, w: 1, h: 1 };
        default:
            return { x: 0, y: 0, w: 1, h: 1 };
    }
}

/** The same rectangle in pixels, for a canvas of a given size. */
export function slotPixels(
    slot: LayerSlot,
    canvasWidth: number,
    canvasHeight: number,
    custom?: SlotRect
): { left: number; top: number; width: number; height: number } {
    const r = slotRect(slot, custom);
    return {
        left: Math.round(r.x * canvasWidth),
        top: Math.round(r.y * canvasHeight),
        width: Math.round(r.w * canvasWidth),
        height: Math.round(r.h * canvasHeight),
    };
}

/** A human label for a slot, for the inspector. */
export function slotLabel(slot: LayerSlot): string {
    switch (slot) {
        case "full":
            return "Full frame";
        case "left":
            return "Left half";
        case "right":
            return "Right half";
        case "top":
            return "Top half";
        case "bottom":
            return "Bottom half";
        case "q1":
            return "Top left quarter";
        case "q2":
            return "Top right quarter";
        case "q3":
            return "Bottom left quarter";
        case "q4":
            return "Bottom right quarter";
        case "pip-tl":
            return "Inset, top left";
        case "pip-tr":
            return "Inset, top right";
        case "pip-bl":
            return "Inset, bottom left";
        case "pip-br":
            return "Inset, bottom right";
        case "lower-third":
            return "Lower third";
        case "custom":
            return "Placed by hand";
        default:
            return slot;
    }
}

// ───────────────────────────── Transitions ─────────────────────────────────

export interface PresetTransition {
    kind: TransitionKind;
    durationMs: number;
}

/**
 * What a preset means.
 *
 * The preset matters more than the individual kinds. A timeline that picks a
 * different transition per boundary looks like a slideshow template; one preset
 * applied throughout looks like an edit. So the planner and the UI both choose
 * a preset, and the per-boundary kind is derived from it unless a human
 * overrides one.
 *
 * Durations are short on purpose. A 400ms dissolve reads as a deliberate soften;
 * a 1s one reads as a wedding video, and on a 3-second scene it eats a third of
 * the shot.
 */
export function presetTransition(preset: TransitionPreset): PresetTransition {
    switch (preset) {
        case "snappy":
            // Cuts, which is what short vertical video actually uses. The
            // default for reels and stories.
            return { kind: "cut", durationMs: 0 };
        case "soft":
            return { kind: "dissolve", durationMs: 400 };
        case "graphic":
            // A wipe reads as designed rather than filmed, which suits motion
            // graphics and carousels exported as video.
            return { kind: "wipe", durationMs: 300 };
        case "energetic":
            return { kind: "whip", durationMs: 200 };
        case "none":
        default:
            return { kind: "cut", durationMs: 0 };
    }
}

/** A human label and a one-line description, for the preset picker. */
export function presetLabel(preset: TransitionPreset): { label: string; hint: string } {
    switch (preset) {
        case "snappy":
            return { label: "Snappy", hint: "Straight cuts. What short vertical video actually uses." };
        case "soft":
            return { label: "Soft", hint: "Short dissolves. Suits long-form and talking head." };
        case "graphic":
            return { label: "Graphic", hint: "Wipes. Reads as designed rather than filmed." };
        case "energetic":
            return { label: "Energetic", hint: "Fast whips. Heavy going for more than a few cuts." };
        case "none":
        default:
            return { label: "None", hint: "Hard cuts everywhere, with no overlap at all." };
    }
}

/** Whether the in-app preview can show this transition faithfully. */
export function previewFidelity(kind: TransitionKind): "faithful" | "approximate" | "placeholder" {
    switch (kind) {
        case "cut":
        case "dissolve":
        case "dip":
        case "slide":
            return "faithful";
        case "wipe":
            return "approximate";
        case "blur-dissolve":
        case "whip":
            // Both need a per-frame filter the preview has no way to run, so
            // it shows a plain dissolve and SAYS SO. A preview that silently
            // substituted one would have the user approve something the export
            // does not produce.
            return "placeholder";
        default:
            return "approximate";
    }
}

// ─────────────────────── Rendering: studio → composition ───────────────────
//
// A studio renders by being CONVERTED into a Composition and handed to the
// existing composition renderer. That is deliberate and it is the most
// important decision in the render path.
//
// The alternative — a second renderer for studios — would mean two
// implementations of the frame-grid arithmetic that xfade depends on, two
// opinions on how a cross-fade consumes time, and two places for a
// half-frame error to make a cross-fade fade from nothing. The composition
// renderer already gets all of that right, and it is shared with the worker.
// So the studio's job is to describe itself in the terms that renderer
// already understands.
//
// ⚠️ TWO THINGS DO NOT SURVIVE THE CONVERSION, and both are reported as
// problems rather than silently dropped:
//
//  1. LAYER STACKS. A composition clip is one full-frame source; it has no
//     concept of a slot. So a scene with a split screen or type over footage
//     cannot render through this path yet. Rendering only the base layer would
//     publish something the user never approved, which is worse than refusing.
//  2. STYLISED TRANSITIONS. The composition runtime knows `cut` and `fade`.
//     Everything richer maps to a fade, and the conversion SAYS SO, so nobody
//     approves a whip pan and publishes a dissolve.

import type {
    AudioPlacement,
    Clip,
    Composition,
    CompositionAudio,
    CompositionTransition,
} from "./composition-runtime";
import { measureComposition } from "./composition-runtime";
import type {
    IAudioLane,
    IStudio,
    IStudioLayer,
    IStudioScene,
} from "../firestore/trendly-pro/models/studio";
import { effectiveSceneMs, orderedScenes } from "../firestore/trendly-pro/models/studio";

/** The minimum a caller has to know about a piece of media to render it. */
export interface RenderableMedia {
    url: string;
    kind: "image" | "video" | "audio";
    durationMs?: number;
}

export interface StudioCompositionResult {
    composition: Composition;
    /**
     * The studio's sound, resolved onto the composition's own clock.
     *
     * Undefined means silence, which is NOT the same as "no audio field" — a
     * studio with a bed whose media row has vanished returns undefined and a
     * note, rather than a bed url that 404s mid-render.
     */
    audio?: CompositionAudio;
    /**
     * Why this studio cannot render as authored, in sentences meant for a
     * person. A non-empty list must BLOCK the render: every entry is something
     * the user would not recognise in the output.
     */
    problems: string[];
    /**
     * Differences the render will have that are acceptable but must be shown —
     * a stylised transition rendering as a dissolve, for one.
     */
    notes: string[];
}

/**
 * The synthetic revision id a studio scene's HTML is loaded by.
 *
 * A studio scene carries its HTML on the layer rather than in a `designs`
 * revision, and the composition renderer resolves design clips through an
 * injected `loadRevision`. So the id encodes where to find it, and the worker's
 * loader understands this prefix. It keeps the shared composition types
 * untouched, which is the point of the injection existing at all.
 */
export function sceneHtmlRef(studioId: string, sceneId: string): string {
    return `studio:${studioId}:${sceneId}`;
}

/** Parse a synthetic ref back. Returns null for an ordinary revision id. */
export function parseSceneHtmlRef(
    ref: string
): { studioId: string; sceneId: string } | null {
    if (!ref.startsWith("studio:")) return null;
    const [, studioId, sceneId] = ref.split(":");
    if (!studioId || !sceneId) return null;
    return { studioId, sceneId };
}

/**
 * What each studio transition is actually DRAWN as, by name.
 *
 * These are FFmpeg `xfade` transition names. Every one of the studio's seven
 * kinds used to collapse to a plain cross-fade, with a note apologising for it
 * — because `CompositionTransition` only knew `cut` and `fade`, and the
 * renderer had `transition=fade` hardcoded. xfade has had forty of these for
 * years; nothing needed inventing, only carrying through.
 *
 * ⚠️ WHIP IS THE ONE THAT IS STILL NOT ITSELF. A whip pan is directional motion
 * blur, and xfade has no such transition — `hblur` blurs but does not travel,
 * `slideleft` travels but does not blur. It is mapped to the slide, which is
 * the honest half of it, and it keeps a note. The other six are now exact, so
 * the note is about one transition instead of six.
 *
 * Only names present in FFmpeg 5.x are used: the worker's container installs
 * Debian's ffmpeg, and `hlwind` and friends arrived later. The worker also
 * probes its own build and falls back to `fade` for anything it does not
 * recognise, so a newer or older image degrades rather than failing a render.
 */
export function xfadeStyleFor(kind: TransitionKind): { style: string; note?: string } {
    switch (kind) {
        case "dissolve":
            return { style: "fade" };
        case "dip":
            // "Dip to black" — exactly what fadeblack does.
            return { style: "fadeblack" };
        case "slide":
            return { style: "slideleft" };
        case "wipe":
            return { style: "wiperight" };
        case "blur-dissolve":
            return { style: "hblur" };
        case "whip":
            return {
                style: "slideleft",
                note: "A whip renders as a fast slide — the blur it needs isn't something the encoder can draw yet.",
            };
        default:
            return { style: "fade" };
    }
}

/**
 * Map a studio transition onto the renderer's.
 *
 * `kind` decides TIMING — whether the clips overlap at all — and `style`
 * decides what is drawn during the overlap. Keeping them apart is what lets a
 * wipe be a wipe without a second opinion about how long it lasts.
 */
export function toCompositionTransition(
    kind: TransitionKind | undefined,
    ms: number
): { transition: CompositionTransition; note?: string } {
    if (!kind || kind === "cut" || !(ms > 0)) {
        return { transition: { kind: "cut", ms: 0 } };
    }
    const { style, note } = xfadeStyleFor(kind);
    return { transition: { kind: "fade", ms, style }, note };
}

/**
 * Every media id a studio's SOUND references.
 *
 * Separate from `sceneMediaIds`, which answers "what pictures does this scene
 * place" and is what the scene's own refcount is derived from. Sound hangs off
 * two different places — the document's lanes and each scene's narration — and
 * a caller that only walked the layers would load the bed's row and not the
 * voice's, which is how a paid-for voiceover renders as silence.
 */
export function studioAudioMediaIds(
    // Structural rather than `Pick<IStudio, "audio">`: the render worker holds
    // its studio as a bag of Firestore fields, and typing this to the model
    // forced an `as never` at the call site — which switched off checking at
    // exactly the boundary where these two field NAMES are load-bearing. Get
    // `audio` or `narration` wrong and this returns nothing, no media is
    // loaded, and the export goes silent again with no error to follow.
    studio: { audio?: { lanes?: { mediaId?: string }[] } | null },
    sceneMap: Record<string, { narration?: { mediaId?: string } | null }>
): string[] {
    const seen = new Set<string>();
    for (const lane of studio.audio?.lanes ?? []) {
        if (lane.mediaId) seen.add(lane.mediaId);
    }
    for (const scene of Object.values(sceneMap)) {
        const id = scene.narration?.mediaId;
        if (id) seen.add(id);
    }
    return [...seen];
}

/** An audio row, or nothing — a picture on an audio lane is not sound. */
function audioAsset(
    media: Record<string, RenderableMedia>,
    mediaId?: string
): RenderableMedia | undefined {
    if (!mediaId) return undefined;
    const asset = media[mediaId];
    if (!asset?.url) return undefined;
    if (asset.kind !== "audio") return undefined;
    return asset;
}

/**
 * Resolve a studio's sound against the timeline that is actually being
 * rendered.
 *
 * `startOf` maps a scene id to where its clip begins, taken from
 * `measureComposition` — see `AudioPlacement.startMs` for why it must come
 * from there and not from `measureStudio`.
 *
 * ⚠️ A MISSING NARRATION BLOCKS, A MISSING LANE DOES NOT. The asymmetry is
 * deliberate. A scene with `fitToNarration` has had its own length stretched to
 * hold a spoken line, so a narration whose audio has gone is a picture timed
 * around something the viewer will never hear — the export would be wrong, not
 * merely quieter. A bed or an effect that has been archived leaves a video that
 * is still the one the user authored, minus some sound, and refusing to publish
 * over it would be the tool getting in the way.
 */
export function studioAudio(
    studio: Pick<IStudio, "audio">,
    sceneMap: Record<string, IStudioScene>,
    media: Record<string, RenderableMedia>,
    startOf: (sceneId: string) => number | undefined
): { audio?: CompositionAudio; problems: string[]; notes: string[] } {
    const problems: string[] = [];
    const notes: string[] = [];
    const placements: AudioPlacement[] = [];
    // Deduped at the point of writing rather than by the caller: three archived
    // lanes are one thing to tell the user, not the same sentence three times.
    const say = (into: string[], line: string) => {
        if (!into.includes(line)) into.push(line);
    };

    let musicUrl: string | undefined;
    let musicVolume: number | undefined;
    let duckMusic: boolean | undefined;
    let extraBeds = 0;

    const place = (
        asset: RenderableMedia,
        startMs: number,
        lane?: Pick<IAudioLane, "volume" | "fadeInMs" | "fadeOutMs" | "trimInMs" | "trimOutMs">
    ) => {
        placements.push({
            url: asset.url,
            // Negative would make FFmpeg's adelay a no-op and silently move the
            // sound to zero, so a line anchored before the timeline starts is
            // pinned to the start instead.
            startMs: Math.max(0, Math.round(startMs)),
            volume: lane?.volume,
            trimInMs: lane?.trimInMs,
            trimOutMs: lane?.trimOutMs,
            fadeInMs: lane?.fadeInMs,
            fadeOutMs: lane?.fadeOutMs,
            durationMs: asset.durationMs,
        });
    };

    for (const lane of studio.audio?.lanes ?? []) {
        const asset = audioAsset(media, lane.mediaId);
        if (!asset) {
            say(notes, "A piece of sound is missing from your library and will not be heard.");
            continue;
        }

        if (lane.kind === "music") {
            if (musicUrl) {
                extraBeds++;
                continue;
            }
            musicUrl = asset.url;
            musicVolume = lane.volume;
            // The UI's ducking switch lives on the music lane, so that is where
            // the answer comes from.
            duckMusic = lane.duckMusic;
            continue;
        }

        // Voiceover and sfx are anchored to a scene; `fromStart` is the escape
        // hatch for a lane that genuinely belongs to the whole document.
        const sceneStart = lane.fromStart ? 0 : lane.sceneId ? startOf(lane.sceneId) : undefined;
        if (sceneStart === undefined) {
            say(notes, "A piece of sound points at a scene that is no longer there.");
            continue;
        }
        place(asset, sceneStart + (lane.offsetMs ?? 0), lane);
    }

    if (extraBeds > 0) {
        say(
            notes,
            extraBeds === 1
                ? "Only the first music bed is used; the second one is ignored."
                : `Only the first music bed is used; ${extraBeds} others are ignored.`
        );
    }

    // Narration, scene by scene. An empty `mediaId` is not a missing file — it
    // is a line nobody has generated yet, which is the ordinary state and must
    // never block a render.
    for (const scene of Object.values(sceneMap)) {
        const narration = scene.narration;
        if (!narration?.mediaId) continue;

        const asset = audioAsset(media, narration.mediaId);
        if (!asset) {
            say(
                problems,
                "A scene's voiceover is missing from your library. Generate it again, " +
                    "or clear the line, before exporting."
            );
            continue;
        }
        const start = startOf(scene.id);
        if (start === undefined) continue;
        place(asset, start + (narration.offsetMs ?? 0));
    }

    if (!musicUrl && placements.length === 0) {
        return { audio: undefined, problems, notes };
    }

    placements.sort((a, b) => a.startMs - b.startMs);

    return {
        audio: {
            musicUrl,
            musicVolume,
            duckMusic,
            placements: placements.length ? placements : undefined,
        },
        problems,
        notes,
    };
}

/**
 * Describe a studio as a Composition the existing renderer can execute.
 *
 * `media` resolves the ids the scenes reference. A missing one is a problem,
 * not an omission: a scene whose clip has been archived out from under it would
 * otherwise render as a gap.
 */
export function studioToComposition(
    studio: IStudio,
    sceneMap: Record<string, IStudioScene>,
    media: Record<string, RenderableMedia>
): StudioCompositionResult {
    const problems: string[] = [];
    const notes: string[] = [];
    const clips: Clip[] = [];

    const ordered = orderedScenes(studio, sceneMap);
    ordered.forEach((scene, index) => {
        const layers = scene.layers ?? [];
        const position = index + 1;

        if (layers.length === 0) {
            problems.push(`Scene ${position} is empty. Put something in it or remove it.`);
            return;
        }
        if (layers.length > 1) {
            // A stack of pictures and documents is a LAYOUT, and Chromium draws
            // layouts — so it is composed into one document and rendered as a
            // design. Only footage still refuses, because video is decoded by
            // FFmpeg and never by the browser. See the section below.
            const composable = stackIsComposable(layers, media);
            if (!composable.ok) {
                problems.push(
                    `Scene ${position} can't be exported yet because ${composable.reason}. ` +
                        `A split screen of stills or type over a still does export — ` +
                        `it's video inside a stack that doesn't.`
                );
                return;
            }
        }

        const durationMs = effectiveSceneMs(scene);
        if (!(durationMs > 0)) {
            problems.push(`Scene ${position} has no length.`);
            return;
        }

        const { transition, note } = toCompositionTransition(
            scene.transitionIn?.kind,
            index === 0 ? 0 : (scene.transitionIn?.durationMs ?? 0)
        );
        if (note && !notes.includes(note)) notes.push(note);

        const clip: Clip = { id: scene.id, durationMs, transitionIn: transition, source: { kind: "cut" } as never };

        // A composed stack goes down the design path, exactly as a single html
        // layer does: the worker's loader recognises the same synthetic ref and
        // composes the scene's layers when there is more than one.
        if (layers.length > 1) {
            clip.source = { kind: "design", revisionId: sceneHtmlRef(studio.id, scene.id) };
            clips.push(clip);
            return;
        }

        const layer = layers[0];

        if (layer.kind === "html") {
            clip.source = {
                kind: "design",
                revisionId: sceneHtmlRef(studio.id, scene.id),
            };
        } else {
            const asset = layer.mediaId ? media[layer.mediaId] : undefined;
            if (!asset?.url) {
                problems.push(
                    `Scene ${position}'s media is missing. It may have been archived — replace it.`
                );
                return;
            }
            if (asset.kind === "video") {
                clip.source = {
                    kind: "footage",
                    url: asset.url,
                    inMs: layer.trimInMs,
                    outMs: layer.trimOutMs,
                    speed: layer.speed,
                    // Default 0: a clip's own sound is OFF unless asked for,
                    // because most placed footage carries room noise nobody
                    // wants under a voiceover.
                    volume: layer.volume ?? 0,
                };
            } else if (asset.kind === "image") {
                clip.source = {
                    kind: "image",
                    url: asset.url,
                    kenBurns: layer.kenBurns ? "in" : "none",
                };
            } else {
                problems.push(`Scene ${position} points at audio, which cannot be a picture.`);
                return;
            }
        }

        clips.push(clip);
    });

    if (clips.length === 0 && problems.length === 0) {
        problems.push("There are no scenes to render yet.");
    }

    const composition: Composition = {
        width: studio.width,
        height: studio.height,
        fps: studio.fps || 30,
        tracks: [{ kind: "video", clips }],
    };

    // Sound is resolved against THIS composition, measured. A clip's id is its
    // scene's id, which is what lets a scene-anchored voiceover find the frame
    // its picture starts on — through the same arithmetic the renderer will
    // use, rather than a second opinion about it.
    const starts = new Map<string, number>();
    for (const m of measureComposition(composition).clips) starts.set(m.clip.id, m.startMs);
    const sound = studioAudio(studio, sceneMap, media, (sceneId) => starts.get(sceneId));
    for (const p of sound.problems) if (!problems.includes(p)) problems.push(p);
    for (const n of sound.notes) if (!notes.includes(n)) notes.push(n);

    return { composition, audio: sound.audio, problems, notes };
}

// ─────────────────── Layer stacks: composing them to render ────────────────
//
// A composition clip is ONE full-frame source, which is why a layered scene
// could be previewed and not exported: there was nowhere to put the second
// layer. The refusal was right — rendering only the base layer would publish
// something the user never approved — but it refused every stack, including the
// ones that need nothing new to render at all.
//
// A split screen of two stills, or type over a still, is a LAYOUT. Chromium
// already draws layouts, the design path already renders Chromium, and
// `slotRect` already says where each layer goes. So a stack whose layers are
// all pictures and documents is composed into one HTML document and rendered as
// a design clip — the same path a single html layer takes.
//
// ⚠️ VIDEO IS THE EXCEPTION, AND STILL REFUSES. Footage is decoded by FFmpeg
// and never by Chromium — deliberately, because a browser decoding video frame
// by frame at render time is neither accurate nor fast. A stack containing a
// video layer therefore still cannot export, and that refusal now says which
// layer is the problem instead of refusing all stacks alike.

/** Escape text for an HTML attribute or body. */
function esc(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * The `<body>` of one layer, positioned in its slot.
 *
 * An html layer is placed in an iframe-free wrapper: its own document body is
 * injected inside a positioned div. That is a deliberate simplification over a
 * real iframe — an iframe would isolate styles properly, and it would also need
 * the renderer to wait for N nested documents to settle, which is the slowest
 * and least predictable part of a Chromium render. A stack is at most a handful
 * of layers authored by the same generator, so style collisions are a smaller
 * risk than a render that times out.
 */
function layerHtml(
    layer: IStudioLayer,
    media: Record<string, RenderableMedia>,
    width: number,
    height: number
): string {
    const r = slotPixels(layer.slot, width, height, layer.rect);
    const base =
        `position:absolute;left:${r.left}px;top:${r.top}px;` +
        `width:${r.width}px;height:${r.height}px;overflow:hidden;` +
        (layer.opacity !== undefined && layer.opacity < 1 ? `opacity:${layer.opacity};` : "");

    if (layer.kind === "html") {
        // The layer's document, dropped in as-is. Its own <html>/<body> tags
        // are harmless inside a div — browsers drop them — and stripping them
        // with a regex would corrupt any document that mentions them in text.
        return `<div style="${base}">${layer.html ?? ""}</div>`;
    }

    const asset = layer.mediaId ? media[layer.mediaId] : undefined;
    const fit = layer.fit === "contain" ? "contain" : "cover";
    return (
        `<div style="${base}">` +
        `<img src="${esc(asset?.url ?? "")}" ` +
        `style="width:100%;height:100%;object-fit:${fit};display:block" />` +
        `</div>`
    );
}

/** Whether every layer in this stack can be drawn by Chromium. */
export function stackIsComposable(
    layers: IStudioLayer[],
    media: Record<string, RenderableMedia>
): { ok: true } | { ok: false; reason: string } {
    for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        if (l.kind === "html") continue;
        const asset = l.mediaId ? media[l.mediaId] : undefined;
        if (!asset?.url) {
            return { ok: false, reason: `layer ${i + 1}'s media is missing` };
        }
        if (asset.kind === "video") {
            return { ok: false, reason: `layer ${i + 1} is video` };
        }
        if (asset.kind === "audio") {
            return { ok: false, reason: `layer ${i + 1} is audio, which cannot be a picture` };
        }
    }
    return { ok: true };
}

/**
 * Compose a layer stack into one HTML document.
 *
 * Layers are drawn in array order, first at the back — the same order the rail
 * and the inspector show them in, so what the user dragged to the front is in
 * front here too.
 */
export function composeStackHtml(
    layers: IStudioLayer[],
    media: Record<string, RenderableMedia>,
    width: number,
    height: number
): string {
    const body = layers.map((l) => layerHtml(l, media, width, height)).join("");
    // A fixed-size positioning context, because every slot is in pixels of the
    // canvas. `data-slide` is what the existing renderer looks for.
    return (
        `<!doctype html><html><head><meta charset="utf-8"><style>` +
        `html,body{margin:0;padding:0;background:#000}` +
        `*{box-sizing:border-box}` +
        `</style></head><body>` +
        `<div data-slide style="position:relative;width:${width}px;height:${height}px;overflow:hidden">` +
        body +
        `</div></body></html>`
    );
}
