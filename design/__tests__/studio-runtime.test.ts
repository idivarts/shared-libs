import {
    parseSceneHtmlRef,
    presetTransition,
    previewFidelity,
    sceneHtmlRef,
    slotRect,
    composeStackHtml,
    stackIsComposable,
    studioAudio,
    studioAudioMediaIds,
    studioToComposition,
    toCompositionTransition,
    type RenderableMedia,
} from "../studio-runtime";
import { measureComposition } from "../composition-runtime";
import type { IStudio, IStudioScene } from "../../firestore/trendly-pro/models/studio";

const studio = (over: Partial<IStudio> = {}): IStudio => ({
    id: "st1",
    format: "reel",
    width: 1080,
    height: 1920,
    fps: 30,
    sceneOrder: [],
    createdAt: 0,
    ...over,
});

const scene = (id: string, over: Partial<IStudioScene> = {}): IStudioScene => ({
    id,
    primaryKind: "image",
    durationMs: 3000,
    layers: [{ id: "l1", kind: "media", slot: "full", mediaId: "m1" }],
    mediaIds: ["m1"],
    createdAt: 0,
    ...over,
});

const media: Record<string, RenderableMedia> = {
    m1: { url: "https://cdn/x.jpg", kind: "image" },
    v1: { url: "https://cdn/x.mp4", kind: "video", durationMs: 8000 },
    bed: { url: "https://cdn/bed.mp3", kind: "audio", durationMs: 30000 },
    vo1: { url: "https://cdn/vo1.mp3", kind: "audio", durationMs: 1800 },
    vo2: { url: "https://cdn/vo2.mp3", kind: "audio", durationMs: 1500 },
};

describe("slot geometry", () => {
    // The geometry is shared with the render worker, so a split screen looks
    // the same in the app as in the export. These numbers are the contract.
    it("splits the frame in half", () => {
        expect(slotRect("left")).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
        expect(slotRect("right")).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 });
    });

    it("puts an inset inside the frame, not against the edge", () => {
        const pip = slotRect("pip-br");
        expect(pip.x + pip.w).toBeLessThan(1);
        expect(pip.y + pip.h).toBeLessThan(1);
    });

    it("gives a custom slot the layer's own rectangle", () => {
        const own = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
        expect(slotRect("custom", own)).toEqual(own);
        // And falls back to the full frame rather than collapsing to nothing
        // when a custom slot has no rectangle — a layer with no size is
        // invisible, which reads as a bug rather than as a mistake.
        expect(slotRect("custom")).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    });
});

describe("transitions", () => {
    it("draws each kind as itself rather than as a dissolve", () => {
        // ALL SEVEN used to collapse to a plain cross-fade with a note
        // apologising for it. `kind` is timing, `style` is what is drawn — and
        // these are the names FFmpeg's xfade has had for years.
        const style = (k: Parameters<typeof toCompositionTransition>[0]) =>
            toCompositionTransition(k, 400).transition.style;
        expect(style("dissolve")).toBe("fade");
        expect(style("dip")).toBe("fadeblack");
        expect(style("slide")).toBe("slideleft");
        expect(style("wipe")).toBe("wiperight");
        expect(style("blur-dissolve")).toBe("hblur");
    });

    it("keeps the timing separate from the drawing", () => {
        // A wipe and a dissolve overlap identically. If `kind` ever varied with
        // the style, measureComposition's clamp would differ per transition and
        // the timeline would depend on a cosmetic choice.
        const wipe = toCompositionTransition("wipe", 400).transition;
        const dissolve = toCompositionTransition("dissolve", 400).transition;
        expect(wipe.kind).toBe(dissolve.kind);
        expect(wipe.ms).toBe(dissolve.ms);
        expect(wipe.style).not.toBe(dissolve.style);
    });

    it("notes ONLY the whip, which is the one still not itself", () => {
        // A whip pan is directional motion blur and xfade has nothing that both
        // travels and blurs. It renders as the slide — the honest half — and
        // keeps its note. The other six no longer need one.
        expect(toCompositionTransition("whip", 200).note).toContain("fast slide");
        for (const k of ["dissolve", "dip", "slide", "wipe", "blur-dissolve"] as const) {
            expect(toCompositionTransition(k, 400).note).toBeUndefined();
        }
    });

    it("carries the style through the measurement", () => {
        // measureComposition rebuilds each transition from scratch, and only
        // knew about `kind` — which is how a wipe became a dissolve on the way
        // to the renderer even once the mapping existed.
        const s = studio({ sceneOrder: ["a", "b"] });
        const b = scene("b", { transitionIn: { kind: "wipe", durationMs: 400 } });
        const { composition } = studioToComposition(s, { a: scene("a"), b }, media);
        expect(measureComposition(composition).clips[1].transition.style).toBe("wiperight");
    });

    it("treats a cut, and a zero-length transition, as no overlap at all", () => {
        expect(toCompositionTransition("cut", 400).transition).toEqual({ kind: "cut", ms: 0 });
        expect(toCompositionTransition("dissolve", 0).transition).toEqual({ kind: "cut", ms: 0 });
    });

    it("says which transitions the preview cannot show faithfully", () => {
        expect(previewFidelity("dissolve")).toBe("faithful");
        expect(previewFidelity("whip")).toBe("placeholder");
    });

    it("defaults short vertical formats to cuts", () => {
        // Snappy is the reel default, and short vertical video really does cut.
        expect(presetTransition("snappy")).toEqual({ kind: "cut", durationMs: 0 });
        expect(presetTransition("soft").kind).toBe("dissolve");
    });
});

describe("studio to composition", () => {
    it("turns scenes into clips in sceneOrder", () => {
        const s = studio({ sceneOrder: ["b", "a"] });
        const { composition, problems } = studioToComposition(
            s,
            { a: scene("a"), b: scene("b") },
            media
        );
        expect(problems).toEqual([]);
        expect(composition.tracks[0].clips.map((c) => c.id)).toEqual(["b", "a"]);
        expect(composition.width).toBe(1080);
        expect(composition.fps).toBe(30);
    });

    it("refuses a layered scene instead of rendering only its base layer", () => {
        const s = studio({ sceneOrder: ["a"] });
        const layered = scene("a", {
            layers: [
                { id: "l1", kind: "media", slot: "full", mediaId: "m1" },
                { id: "l2", kind: "media", slot: "pip-br", mediaId: "m1" },
            ],
        });

        const { problems, composition } = studioToComposition(s, { a: layered }, media);
        // A split screen of two stills is a LAYOUT, and Chromium draws layouts.
        // It used to refuse every stack alike; it now renders as one composed
        // design document.
        expect(problems).toEqual([]);
        expect(composition.tracks[0].clips).toHaveLength(1);
        expect(composition.tracks[0].clips[0].source).toEqual({
            kind: "design",
            revisionId: "studio:st1:a",
        });
    });

    it("still refuses a stack with VIDEO in it, and says which layer", () => {
        // Footage is decoded by FFmpeg and never by Chromium — deliberately, so
        // a composed document cannot contain it. The refusal is now about the
        // one layer that cannot be drawn rather than about stacks in general.
        const s = studio({ sceneOrder: ["a"] });
        const withVideo = scene("a", {
            layers: [
                { id: "l1", kind: "media", slot: "full", mediaId: "m1" },
                { id: "l2", kind: "media", slot: "pip-br", mediaId: "v1" },
            ],
        });
        const { problems, composition } = studioToComposition(s, { a: withVideo }, media);
        expect(problems.join(" ")).toContain("layer 2 is video");
        expect(composition.tracks[0].clips).toHaveLength(0);
    });

    it("refuses a stack whose media has been archived, naming the layer", () => {
        const s = studio({ sceneOrder: ["a"] });
        const gone = scene("a", {
            layers: [
                { id: "l1", kind: "media", slot: "full", mediaId: "m1" },
                { id: "l2", kind: "media", slot: "pip-br", mediaId: "nope" },
            ],
        });
        expect(studioToComposition(s, { a: gone }, media).problems.join(" ")).toContain(
            "layer 2's media is missing"
        );
    });

    it("composes a stack back-to-front, in array order", () => {
        // The order the rail and the inspector show, so what the user dragged
        // to the front is in front here too.
        const html = composeStackHtml(
            [
                { id: "l1", kind: "media", slot: "full", mediaId: "m1" },
                { id: "l2", kind: "html", slot: "lower-third", html: "<p>Caption</p>" },
            ],
            media,
            1080,
            1920
        );
        expect(html.indexOf("x.jpg")).toBeLessThan(html.indexOf("Caption"));
        // Slot geometry in pixels of the canvas, from the same slotRect the
        // preview uses — which is what makes the export match the preview.
        expect(html).toContain("width:1080px;height:1920px");
        expect(html).toContain("data-slide");
    });

    it("escapes a url rather than letting it close the attribute", () => {
        const html = composeStackHtml(
            [{ id: "l1", kind: "media", slot: "full", mediaId: "evil" }],
            { evil: { url: 'https://x/a.jpg" onerror="alert(1)', kind: "image" } },
            100,
            100
        );
        expect(html).not.toContain('onerror="alert(1)"');
        expect(html).toContain("&quot;");
    });

    it("says a composable stack is composable, and why one is not", () => {
        expect(stackIsComposable([{ id: "l1", kind: "html", slot: "full", html: "<b/>" }], media)).toEqual({
            ok: true,
        });
        const bad = stackIsComposable(
            [{ id: "l1", kind: "media", slot: "full", mediaId: "v1" }],
            media
        );
        expect(bad.ok).toBe(false);
    });

    it("refuses an empty scene and a scene whose media has gone", () => {
        const s = studio({ sceneOrder: ["a", "b"] });
        const empty = scene("a", { layers: [], mediaIds: [] });
        const orphan = scene("b", {
            layers: [{ id: "l1", kind: "media", slot: "full", mediaId: "gone" }],
            mediaIds: ["gone"],
        });

        const { problems } = studioToComposition(s, { a: empty, b: orphan }, media);
        expect(problems.join(" ")).toContain("Scene 1 is empty");
        expect(problems.join(" ")).toContain("missing");
    });

    it("carries a video layer's trim, speed and volume onto the clip", () => {
        const s = studio({ sceneOrder: ["a"] });
        const v = scene("a", {
            primaryKind: "video",
            layers: [
                {
                    id: "l1",
                    kind: "media",
                    slot: "full",
                    mediaId: "v1",
                    trimInMs: 1000,
                    trimOutMs: 4000,
                    speed: 2,
                    volume: 1,
                },
            ],
            mediaIds: ["v1"],
        });

        const { composition, problems } = studioToComposition(s, { a: v }, media);
        expect(problems).toEqual([]);
        expect(composition.tracks[0].clips[0].source).toEqual({
            kind: "footage",
            url: "https://cdn/x.mp4",
            inMs: 1000,
            outMs: 4000,
            speed: 2,
            volume: 1,
        });
    });

    it("strips a clip's own sound unless it was asked for", () => {
        const s = studio({ sceneOrder: ["a"] });
        const v = scene("a", {
            layers: [{ id: "l1", kind: "media", slot: "full", mediaId: "v1" }],
            mediaIds: ["v1"],
        });
        const { composition } = studioToComposition(s, { a: v }, media);
        // Most placed footage carries room noise nobody wants under a
        // voiceover, so silence is the default rather than full level.
        expect((composition.tracks[0].clips[0].source as { volume?: number }).volume).toBe(0);
    });

    it("stretches a scene that fits its narration", () => {
        const s = studio({ sceneOrder: ["a"] });
        const narrated = scene("a", {
            durationMs: 1000,
            narration: {
                line: "Sunday night is when the panic sets in, every single week.",
                source: "paraphrase",
                fitToNarration: true,
            },
        });
        const { composition } = studioToComposition(s, { a: narrated }, media);
        expect(composition.tracks[0].clips[0].durationMs).toBeGreaterThan(1000);
    });

    it("gives the first scene a cut, whatever it declares", () => {
        const s = studio({ sceneOrder: ["a"] });
        const first = scene("a", { transitionIn: { kind: "dissolve", durationMs: 600 } });
        const { composition } = studioToComposition(s, { a: first }, media);
        // There is nothing before scene one to dissolve from.
        expect(composition.tracks[0].clips[0].transitionIn).toEqual({ kind: "cut", ms: 0 });
    });

    it("says there is nothing to render when there are no scenes", () => {
        const { problems } = studioToComposition(studio(), {}, media);
        expect(problems.join(" ")).toContain("no scenes");
    });
});

describe("scene html refs", () => {
    // A studio scene carries its HTML on the layer rather than in a `designs`
    // revision, so the renderer's injected loader resolves it by this id.
    it("round-trips", () => {
        const ref = sceneHtmlRef("st1", "sc9");
        expect(parseSceneHtmlRef(ref)).toEqual({ studioId: "st1", sceneId: "sc9" });
    });

    it("leaves an ordinary revision id alone", () => {
        expect(parseSceneHtmlRef("rev_abc123")).toBeNull();
    });
});

// ─────────────────────────────── Sound ─────────────────────────────────────
//
// The export used to be silent: the worker read `content.audio`, which is the
// OLD content-level shape, while a studio writes lanes on the document and a
// voiceover on each scene. Nothing converted between them, so a bed the user
// attached and a voiceover the brand paid for both rendered as nothing.
//
// What matters below is WHERE each piece lands. A voiceover is anchored to a
// scene, and the number it resolves to has to come from the composition that is
// actually being rendered — so these assert against transitions, which make the
// timeline shorter and are the thing a second, independent measurement would
// get subtly wrong.

const narrated = (id: string, mediaId: string, over: Partial<IStudioScene> = {}) =>
    scene(id, {
        narration: { line: "A line.", source: "paraphrase", mediaId },
        ...over,
    });

describe("a studio's sound", () => {
    it("puts a music lane on the bed and ducks by default", () => {
        const s = studio({
            sceneOrder: ["a"],
            audio: { lanes: [{ id: "L1", kind: "music", mediaId: "bed", fromStart: true, duckMusic: true }] },
        });
        const { audio } = studioToComposition(s, { a: scene("a") }, media);
        expect(audio?.musicUrl).toBe("https://cdn/bed.mp3");
        expect(audio?.duckMusic).toBe(true);
    });

    it("anchors a scene's voiceover to where that scene actually starts", () => {
        const s = studio({ sceneOrder: ["a", "b"] });
        const { audio, problems } = studioToComposition(
            s,
            { a: scene("a"), b: narrated("b", "vo1") },
            media
        );
        expect(problems).toEqual([]);
        // Scene a is 3000ms and the cut takes nothing, so b starts at 3000.
        expect(audio?.placements).toEqual([
            expect.objectContaining({ url: "https://cdn/vo1.mp3", startMs: 3000 }),
        ]);
    });

    it("moves the voiceover earlier by exactly what the transition overlaps", () => {
        // THE REGRESSION THIS FILE EXISTS FOR. A dissolve makes the timeline
        // SHORTER, so scene b begins before the sum of the scenes before it. A
        // voiceover placed from the raw durations would run 400ms late, which on
        // a 3-second scene is a visible lip-sync error.
        const s = studio({ sceneOrder: ["a", "b"] });
        const b = narrated("b", "vo1", { transitionIn: { kind: "dissolve", durationMs: 400 } });
        const { audio } = studioToComposition(s, { a: scene("a"), b }, media);
        expect(audio?.placements?.[0].startMs).toBe(2600);
    });

    it("adds the narration's own offset on top of the scene's start", () => {
        const s = studio({ sceneOrder: ["a", "b"] });
        const b = scene("b", {
            narration: { line: "A line.", source: "paraphrase", mediaId: "vo1", offsetMs: 250 },
        });
        const { audio } = studioToComposition(s, { a: scene("a"), b }, media);
        expect(audio?.placements?.[0].startMs).toBe(3250);
    });

    it("orders placements by when they are heard, not by scene id", () => {
        const s = studio({ sceneOrder: ["z", "a"] });
        const { audio } = studioToComposition(
            s,
            { z: narrated("z", "vo1"), a: narrated("a", "vo2") },
            media
        );
        expect(audio?.placements?.map((p) => p.url)).toEqual([
            "https://cdn/vo1.mp3",
            "https://cdn/vo2.mp3",
        ]);
    });

    it("BLOCKS the render when a scene's voiceover has been archived", () => {
        // The scene's own length may have been stretched to hold this line, so
        // the picture is timed around something nobody would hear. Silence here
        // is not a smaller version of the right export, it is a wrong one.
        const s = studio({ sceneOrder: ["a"] });
        const { problems } = studioToComposition(s, { a: narrated("a", "gone") }, media);
        expect(problems.join(" ")).toContain("voiceover is missing");
    });

    it("does not block a scene whose line was never generated", () => {
        // The ordinary state of a new scene. An empty mediaId is not a missing
        // file, and treating it as one would make every fresh studio unexportable.
        const s = studio({ sceneOrder: ["a"] });
        const a = scene("a", { narration: { line: "A line.", source: "paraphrase" } });
        const { problems, audio } = studioToComposition(s, { a }, media);
        expect(problems).toEqual([]);
        expect(audio).toBeUndefined();
    });

    it("notes a missing bed instead of blocking on it", () => {
        // A video minus its background music is still the video the user made.
        const s = studio({
            sceneOrder: ["a"],
            audio: { lanes: [{ id: "L1", kind: "music", mediaId: "gone", fromStart: true }] },
        });
        const { problems, notes, audio } = studioToComposition(s, { a: scene("a") }, media);
        expect(problems).toEqual([]);
        expect(notes.join(" ")).toContain("missing from your library");
        expect(audio).toBeUndefined();
    });

    it("refuses to treat a picture on an audio lane as sound", () => {
        const s = studio({
            sceneOrder: ["a"],
            audio: { lanes: [{ id: "L1", kind: "music", mediaId: "m1", fromStart: true }] },
        });
        const { audio, notes } = studioToComposition(s, { a: scene("a") }, media);
        expect(audio?.musicUrl).toBeUndefined();
        expect(notes.length).toBeGreaterThan(0);
    });

    it("uses one bed and says so when a second is attached", () => {
        const s = studio({
            sceneOrder: ["a"],
            audio: {
                lanes: [
                    { id: "L1", kind: "music", mediaId: "bed", fromStart: true },
                    { id: "L2", kind: "music", mediaId: "vo1", fromStart: true },
                ],
            },
        });
        const { audio, notes } = studioToComposition(s, { a: scene("a") }, media);
        expect(audio?.musicUrl).toBe("https://cdn/bed.mp3");
        expect(notes.join(" ")).toContain("first music bed");
    });

    it("pins sound anchored before the start to zero", () => {
        // adelay cannot take a negative, and would silently ignore one — which
        // moves the sound to zero anyway, but without anybody deciding that.
        const s = studio({ sceneOrder: ["a"] });
        const a = scene("a", {
            narration: { line: "A line.", source: "paraphrase", mediaId: "vo1", offsetMs: -500 },
        });
        const { audio } = studioToComposition(s, { a }, media);
        expect(audio?.placements?.[0].startMs).toBe(0);
    });

    it("is undefined, not an empty object, when there is no sound", () => {
        const { audio } = studioToComposition(studio({ sceneOrder: ["a"] }), { a: scene("a") }, media);
        expect(audio).toBeUndefined();
    });

    it("drops a scene-anchored lane whose scene is gone", () => {
        const s = studio({
            sceneOrder: ["a"],
            audio: { lanes: [{ id: "L1", kind: "sfx", mediaId: "vo1", sceneId: "deleted" }] },
        });
        const { audio, notes, problems } = studioToComposition(s, { a: scene("a") }, media);
        expect(problems).toEqual([]);
        expect(audio).toBeUndefined();
        expect(notes.join(" ")).toContain("no longer there");
    });

    it("resolves starts through the callback it is given", () => {
        // studioAudio is exported so the caller owns the clock. Passing a
        // deliberately wrong one proves the placement is not secretly
        // recomputing the timeline itself.
        const s = studio({ sceneOrder: ["a"] });
        const { audio } = studioAudio(s, { a: narrated("a", "vo1") }, media, () => 12345);
        expect(audio?.placements?.[0].startMs).toBe(12345);
    });
});

describe("the media a studio's sound needs loaded", () => {
    it("collects lane and narration audio, which the layer walk misses", () => {
        // The render worker loaded media by walking the LAYERS, so neither the
        // bed nor the voice was ever fetched — the urls simply were not there to
        // put in the mix.
        const s = studio({
            sceneOrder: ["a"],
            audio: { lanes: [{ id: "L1", kind: "music", mediaId: "bed", fromStart: true }] },
        });
        const ids = studioAudioMediaIds(s, { a: narrated("a", "vo1") });
        expect(ids.sort()).toEqual(["bed", "vo1"]);
    });

    it("counts a piece used twice once", () => {
        const s = studio({ audio: { lanes: [{ id: "L1", kind: "music", mediaId: "vo1", fromStart: true }] } });
        expect(studioAudioMediaIds(s, { a: narrated("a", "vo1") })).toEqual(["vo1"]);
    });
});
