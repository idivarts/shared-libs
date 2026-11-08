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

import type { Clip, Composition, CompositionTransition } from "./composition-runtime";
import type { IStudio, IStudioScene } from "../firestore/trendly-pro/models/studio";
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

/** Map the studio's seven transitions onto the two the renderer has. */
export function toCompositionTransition(
    kind: TransitionKind | undefined,
    ms: number
): { transition: CompositionTransition; note?: string } {
    if (!kind || kind === "cut" || !(ms > 0)) {
        return { transition: { kind: "cut", ms: 0 } };
    }
    if (kind === "dissolve") {
        return { transition: { kind: "fade", ms } };
    }
    // Everything else renders as a dissolve, and says so. A preview that
    // substituted silently would have the user approve a whip pan and publish
    // a cross-fade.
    return {
        transition: { kind: "fade", ms },
        note: `The "${kind}" transition renders as a dissolve for now.`,
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
            problems.push(
                `Scene ${position} has ${layers.length} layers. Layered scenes can be previewed ` +
                    `but not exported yet — flatten it to one layer to render.`
            );
            return;
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

        const layer = layers[0];
        const clip: Clip = { id: scene.id, durationMs, transitionIn: transition, source: { kind: "cut" } as never };

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

    return {
        composition: {
            width: studio.width,
            height: studio.height,
            fps: studio.fps || 30,
            tracks: [{ kind: "video", clips }],
        },
        problems,
        notes,
    };
}
