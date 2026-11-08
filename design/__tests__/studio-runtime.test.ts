import {
    parseSceneHtmlRef,
    presetTransition,
    previewFidelity,
    sceneHtmlRef,
    slotRect,
    studioToComposition,
    toCompositionTransition,
    type RenderableMedia,
} from "../studio-runtime";
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
    it("maps a dissolve straight through and everything else to a fade, with a note", () => {
        expect(toCompositionTransition("dissolve", 400).transition).toEqual({ kind: "fade", ms: 400 });
        expect(toCompositionTransition("dissolve", 400).note).toBeUndefined();

        const whip = toCompositionTransition("whip", 200);
        expect(whip.transition.kind).toBe("fade");
        // Said rather than substituted silently: otherwise a user approves a
        // whip pan and publishes a cross-fade.
        expect(whip.note).toContain("dissolve");
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
        // Publishing only the base layer would ship something the user never
        // approved, so this blocks rather than degrades.
        expect(problems.join(" ")).toContain("2 layers");
        expect(composition.tracks[0].clips).toHaveLength(0);
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
