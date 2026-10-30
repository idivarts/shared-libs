import {
    clipAt,
    compositionFromDesign,
    DEFAULT_CLIP_MS,
    DEFAULT_TRANSITION_MS,
    isRenderable,
    measureComposition,
    singleDesignPassthrough,
    validateComposition,
    measureOverlays,
    withDerivedOffsets,
    type Clip,
    type Composition,
} from "../composition-runtime";

const design = (revisionId = "rev1"): Clip["source"] => ({ kind: "design", revisionId });

function comp(clips: Clip[], over: Partial<Composition> = {}): Composition {
    return {
        width: 1080,
        height: 1920,
        fps: 30,
        tracks: [{ kind: "video", clips }],
        ...over,
    };
}

describe("measureComposition", () => {
    it("places a single clip at zero and reports its own length", () => {
        const m = measureComposition(comp([{ id: "a", durationMs: 4200, source: design() }]));
        expect(m.clips).toHaveLength(1);
        expect(m.clips[0].startMs).toBe(0);
        expect(m.totalMs).toBe(4200);
    });

    it("subtracts the overlap, so the total is shorter than the sum", () => {
        const m = measureComposition(
            comp([
                { id: "a", durationMs: 3000, source: design() },
                {
                    id: "b",
                    durationMs: 3000,
                    transitionIn: { kind: "fade", ms: 500 },
                    source: design("rev2"),
                },
            ])
        );
        expect(m.clips[1].startMs).toBe(2500);
        expect(m.totalMs).toBe(5500);
    });

    it("ignores a fade on the first clip — there is nothing behind it", () => {
        const m = measureComposition(
            comp([
                {
                    id: "a",
                    durationMs: 2000,
                    transitionIn: { kind: "fade", ms: 800 },
                    source: design(),
                },
            ])
        );
        expect(m.clips[0].transition).toEqual({ kind: "cut", ms: 0 });
        expect(m.totalMs).toBe(2000);
    });

    it("falls back to the default length for a clip with none", () => {
        const m = measureComposition(
            comp([{ id: "a", durationMs: 0 as number, source: design() }])
        );
        expect(m.totalMs).toBe(DEFAULT_CLIP_MS);
    });

    it("gives a declared fade the default length", () => {
        const m = measureComposition(
            comp([
                { id: "a", durationMs: 3000, source: design() },
                {
                    id: "b",
                    durationMs: 3000,
                    transitionIn: { kind: "fade", ms: 0 },
                    source: design("rev2"),
                },
            ])
        );
        expect(m.clips[1].transition.ms).toBe(DEFAULT_TRANSITION_MS);
    });

    it("clamps an overlap to half of the shorter clip", () => {
        const m = measureComposition(
            comp([
                { id: "a", durationMs: 1000, source: design() },
                {
                    id: "b",
                    durationMs: 8000,
                    transitionIn: { kind: "fade", ms: 5000 },
                    source: design("rev2"),
                },
            ])
        );
        expect(m.clips[1].transition.ms).toBe(500);
        expect(m.clips[1].startMs).toBe(500);
    });

    // The clamp's whole purpose. Without it a long transition pushes a clip's
    // start back past its predecessor's, offsets stop increasing, and "which
    // clip is at time T" becomes a coin flip.
    it("keeps offsets strictly increasing for any transition length", () => {
        const lengths = [120, 500, 1000, 3000, 9000];
        const fades = [1, 100, 400, 2500, 50_000];
        for (const a of lengths) {
            for (const b of lengths) {
                for (const fade of fades) {
                    const m = measureComposition(
                        comp([
                            { id: "a", durationMs: a, source: design() },
                            {
                                id: "b",
                                durationMs: b,
                                transitionIn: { kind: "fade", ms: fade },
                                source: design("rev2"),
                            },
                        ])
                    );
                    expect(m.clips[1].startMs).toBeGreaterThan(m.clips[0].startMs);
                    expect(m.totalMs).toBeGreaterThan(m.clips[1].startMs);
                }
            }
        }
    });

    it("measures an empty composition as zero rather than throwing", () => {
        const m = measureComposition(comp([]));
        expect(m.clips).toHaveLength(0);
        expect(m.totalMs).toBe(0);
    });
});

describe("clipAt", () => {
    const m = measureComposition(
        comp([
            { id: "a", durationMs: 1000, source: design() },
            { id: "b", durationMs: 1000, source: design("rev2") },
        ])
    );

    it("resolves the clip under the playhead, boundary included", () => {
        expect(clipAt(m, 0)).toBe(0);
        expect(clipAt(m, 999)).toBe(0);
        expect(clipAt(m, 1000)).toBe(1);
        expect(clipAt(m, 5000)).toBe(1);
    });

    it("reports -1 before the start and on an empty timeline", () => {
        expect(clipAt(m, -1)).toBe(-1);
        expect(clipAt(measureComposition(comp([])), 0)).toBe(-1);
    });
});

describe("withDerivedOffsets", () => {
    it("stamps the caches so stored numbers cannot contradict the runtime", () => {
        const stamped = withDerivedOffsets(
            comp([
                { id: "a", durationMs: 2000, startMs: 999, source: design() },
                {
                    id: "b",
                    durationMs: 2000,
                    startMs: 12345,
                    transitionIn: { kind: "fade", ms: 400 },
                    source: design("rev2"),
                },
            ])
        );
        const clips = stamped.tracks[0].clips;
        expect(clips[0].startMs).toBe(0);
        expect(clips[1].startMs).toBe(1600);
        expect(stamped.durationMs).toBe(3600);
    });
});

describe("singleDesignPassthrough", () => {
    it("recognises one whole design as the pre-composition case", () => {
        const source = singleDesignPassthrough(
            comp([{ id: "a", durationMs: 5000, source: design("revX") }])
        );
        expect(source).toEqual({ kind: "design", revisionId: "revX" });
    });

    it("accepts an explicit cut, which is what no transition means", () => {
        expect(
            singleDesignPassthrough(
                comp([
                    {
                        id: "a",
                        durationMs: 5000,
                        transitionIn: { kind: "cut", ms: 0 },
                        source: design(),
                    },
                ])
            )
        ).not.toBeNull();
    });

    it("accepts an empty track of another kind", () => {
        expect(
            singleDesignPassthrough(
                comp([{ id: "a", durationMs: 5000, source: design() }], {
                    tracks: [
                        { kind: "video", clips: [{ id: "a", durationMs: 5000, source: design() }] },
                        { kind: "overlay", clips: [] },
                    ],
                })
            )
        ).not.toBeNull();
    });

    // Each of these must fall through to the general renderer. Treating any of
    // them as a passthrough would silently drop whatever made it different.
    it.each([
        [
            "a second clip",
            comp([
                { id: "a", durationMs: 1000, source: design() },
                { id: "b", durationMs: 1000, source: design("rev2") },
            ]),
        ],
        [
            "a single scene of the design",
            comp([
                { id: "a", durationMs: 1000, source: { kind: "design", revisionId: "r", sceneIndex: 1 } },
            ]),
        ],
        [
            "a transparent capture",
            comp([
                {
                    id: "a",
                    durationMs: 1000,
                    source: { kind: "design", revisionId: "r", transparent: true },
                },
            ]),
        ],
        [
            "a non-design source",
            comp([{ id: "a", durationMs: 1000, source: { kind: "image", url: "u" } }]),
        ],
        ["no clips", comp([])],
        [
            "a clip on an overlay track",
            comp([{ id: "a", durationMs: 1000, source: design() }], {
                tracks: [
                    { kind: "video", clips: [{ id: "a", durationMs: 1000, source: design() }] },
                    {
                        kind: "overlay",
                        clips: [{ id: "o", durationMs: 500, source: { kind: "image", url: "u" } }],
                    },
                ],
            }),
        ],
        [
            "two video tracks",
            comp([], {
                tracks: [
                    { kind: "video", clips: [{ id: "a", durationMs: 1000, source: design() }] },
                    { kind: "video", clips: [{ id: "b", durationMs: 1000, source: design("r2") }] },
                ],
            }),
        ],
    ])("refuses %s", (_label, composition) => {
        expect(singleDesignPassthrough(composition as Composition)).toBeNull();
    });
});

describe("compositionFromDesign", () => {
    const built = compositionFromDesign({
        revisionId: "rev9",
        width: 1080,
        height: 1920,
        fps: 30,
        durationMs: 7400,
    });

    it("is a passthrough, so an existing design renders exactly as before", () => {
        expect(singleDesignPassthrough(built)).toEqual({ kind: "design", revisionId: "rev9" });
    });

    it("carries the design's own length and size", () => {
        expect(measureComposition(built).totalMs).toBe(7400);
        expect(built.width).toBe(1080);
        expect(built.height).toBe(1920);
        expect(built.fps).toBe(30);
    });

    it("survives a design with no measured duration", () => {
        const fallback = compositionFromDesign({
            revisionId: "r",
            width: 1080,
            height: 1920,
            fps: 30,
            durationMs: 0,
        });
        expect(measureComposition(fallback).totalMs).toBe(DEFAULT_CLIP_MS);
    });

    it("is renderable", () => {
        expect(isRenderable(built)).toBe(true);
    });
});

describe("validateComposition", () => {
    const fatalPaths = (c: Composition) =>
        validateComposition(c)
            .filter((p) => p.fatal)
            .map((p) => p.path);

    it("passes a plain single-design composition", () => {
        expect(validateComposition(comp([{ id: "a", durationMs: 1000, source: design() }]))).toEqual(
            []
        );
    });

    it("rejects footage and images with no url", () => {
        expect(
            fatalPaths(comp([{ id: "a", durationMs: 1000, source: { kind: "footage", url: "" } }]))
        ).toContain("tracks.video.clips[0].source.url");
        expect(
            fatalPaths(comp([{ id: "a", durationMs: 1000, source: { kind: "image", url: "" } }]))
        ).toContain("tracks.video.clips[0].source.url");
    });

    it("rejects a generated clip that has not landed yet", () => {
        expect(
            fatalPaths(
                comp([
                    {
                        id: "a",
                        durationMs: 1000,
                        source: { kind: "genvideo", model: "m", prompt: "p", jobId: "j" },
                    },
                ])
            )
        ).toContain("tracks.video.clips[0].source.url");
    });

    it("accepts a generated clip once its url is in", () => {
        expect(
            fatalPaths(
                comp([
                    {
                        id: "a",
                        durationMs: 1000,
                        source: { kind: "genvideo", model: "m", prompt: "p", url: "u" },
                    },
                ])
            )
        ).toEqual([]);
    });

    it("rejects an inverted trim and a non-positive speed", () => {
        const paths = fatalPaths(
            comp([
                {
                    id: "a",
                    durationMs: 1000,
                    source: { kind: "footage", url: "u", inMs: 2000, outMs: 1000, speed: 0 },
                },
            ])
        );
        expect(paths).toContain("tracks.video.clips[0].source.outMs");
        expect(paths).toContain("tracks.video.clips[0].source.speed");
    });

    it("rejects duplicate clip ids — a UI keys on them", () => {
        expect(
            fatalPaths(
                comp([
                    { id: "same", durationMs: 1000, source: design() },
                    { id: "same", durationMs: 1000, source: design("r2") },
                ])
            )
        ).toContain("tracks.video.clips[1].id");
    });

    it("rejects a composition with no video track, and one with two", () => {
        expect(fatalPaths({ width: 1, height: 1, fps: 30, tracks: [] })).toContain("tracks");
        expect(
            fatalPaths({
                width: 1080,
                height: 1920,
                fps: 30,
                tracks: [
                    { kind: "video", clips: [] },
                    { kind: "video", clips: [] },
                ],
            })
        ).toContain("tracks");
    });

    it("still says plainly that placed audio is not here yet", () => {
        const paths = fatalPaths({
            width: 1080,
            height: 1920,
            fps: 30,
            tracks: [
                { kind: "video", clips: [{ id: "a", durationMs: 1000, source: design() }] },
                { kind: "audio", clips: [{ id: "s", durationMs: 100, source: design() }] },
            ],
        });
        expect(paths).toContain("tracks.audio");
    });

    it("accepts a transparent design on an overlay track", () => {
        expect(
            validateComposition({
                width: 1080,
                height: 1920,
                fps: 30,
                tracks: [
                    { kind: "video", clips: [{ id: "a", durationMs: 4000, source: design() }] },
                    {
                        kind: "overlay",
                        clips: [
                            {
                                id: "caption",
                                startMs: 500,
                                durationMs: 2000,
                                source: { kind: "design", revisionId: "cap", transparent: true },
                            },
                        ],
                    },
                ],
            })
        ).toEqual([]);
    });

    it("refuses an overlay that is not a transparent design", () => {
        const overlay = (clip: Clip) =>
            fatalPaths({
                width: 1080,
                height: 1920,
                fps: 30,
                tracks: [
                    { kind: "video", clips: [{ id: "a", durationMs: 4000, source: design() }] },
                    { kind: "overlay", clips: [clip] },
                ],
            });

        // An overlay IS a transparent design: that is what makes it free, since
        // it inherits the brand's fonts, the palette and the editor.
        expect(
            overlay({ id: "c", durationMs: 1000, source: { kind: "image", url: "u" } })
        ).toContain("tracks.overlay[0].clips[0].source");
        expect(
            overlay({
                id: "c",
                durationMs: 1000,
                source: { kind: "design", revisionId: "r" },
            })
        ).toContain("tracks.overlay[0].clips[0].source.transparent");
        expect(
            overlay({
                id: "c",
                durationMs: 0,
                source: { kind: "design", revisionId: "r", transparent: true },
            })
        ).toContain("tracks.overlay[0].clips[0].durationMs");
    });

    it("keeps a transparent design OFF the video track", () => {
        expect(
            fatalPaths(
                comp([
                    {
                        id: "a",
                        durationMs: 1000,
                        source: { kind: "design", revisionId: "r", transparent: true },
                    },
                ])
            )
        ).toContain("tracks.video.clips[0].source.transparent");
    });

    it("rejects a bad size or frame rate", () => {
        expect(fatalPaths(comp([{ id: "a", durationMs: 1, source: design() }], { width: 0 }))).toContain(
            "size"
        );
        expect(
            fatalPaths(comp([{ id: "a", durationMs: 1, source: design() }], { fps: 240 }))
        ).toContain("fps");
    });

    it("warns without blocking when the first clip declares a fade", () => {
        const problems = validateComposition(
            comp([
                {
                    id: "a",
                    durationMs: 1000,
                    transitionIn: { kind: "fade", ms: 400 },
                    source: design(),
                },
            ])
        );
        expect(problems).toHaveLength(1);
        expect(problems[0].fatal).toBe(false);
        expect(isRenderable(comp([{ id: "a", durationMs: 1000, source: design() }]))).toBe(true);
    });
});

describe("singleDesignPassthrough, measured rather than authored", () => {
    // A fade on the first clip has nothing behind it, so measureComposition
    // normalizes it to a cut. The predicate must agree, or an existing design
    // with a stray transition would take the general path and pick up a second
    // lossy generation for no reason.
    it("still passes when the only clip declares a pointless fade", () => {
        const source = singleDesignPassthrough(
            comp([
                {
                    id: "a",
                    durationMs: 4000,
                    transitionIn: { kind: "fade", ms: 400 },
                    source: design("revP"),
                },
            ])
        );
        expect(source).toEqual({ kind: "design", revisionId: "revP" });
    });
});

describe("measureOverlays", () => {
    function withOverlays(clips: Clip[]): Composition {
        return {
            width: 1080,
            height: 1920,
            fps: 30,
            tracks: [
                { kind: "video", clips: [{ id: "v", durationMs: 10000, source: design() }] },
                { kind: "overlay", clips },
            ],
        };
    }

    const transparent = (id: string): Clip["source"] => ({
        kind: "design",
        revisionId: id,
        transparent: true,
    });

    // The one place startMs means what it says. A gap in the picture can only
    // render as black, so the video track derives its offsets; a gap between
    // captions is the ordinary case, so an overlay's start is authored.
    it("honours an authored start rather than deriving one", () => {
        const got = measureOverlays(
            withOverlays([
                { id: "b", startMs: 6000, durationMs: 1500, source: transparent("b") },
                { id: "a", startMs: 1000, durationMs: 2000, source: transparent("a") },
            ])
        );
        expect(got.map((o) => [o.clip.id, o.startMs, o.durationMs])).toEqual([
            ["a", 1000, 2000],
            ["b", 6000, 1500],
        ]);
    });

    it("leaves gaps between overlays alone", () => {
        const got = measureOverlays(
            withOverlays([
                { id: "a", startMs: 0, durationMs: 1000, source: transparent("a") },
                { id: "b", startMs: 5000, durationMs: 1000, source: transparent("b") },
            ])
        );
        // Nothing should have pulled b back to abut a.
        expect(got[1].startMs).toBe(5000);
    });

    it("defaults a missing start to zero and a missing length to the default", () => {
        const got = measureOverlays(
            withOverlays([{ id: "a", durationMs: 0, source: transparent("a") }])
        );
        expect(got[0].startMs).toBe(0);
        expect(got[0].durationMs).toBe(DEFAULT_CLIP_MS);
    });

    it("is empty when there is no overlay track", () => {
        expect(measureOverlays(comp([{ id: "a", durationMs: 1000, source: design() }]))).toEqual([]);
    });

    // withDerivedOffsets restamps the VIDEO track only; restamping overlays
    // would move every caption to the start of the timeline.
    it("survives withDerivedOffsets with its start intact", () => {
        const stamped = withDerivedOffsets(
            withOverlays([{ id: "a", startMs: 4000, durationMs: 1000, source: transparent("a") }])
        );
        expect(measureOverlays(stamped)[0].startMs).toBe(4000);
    });
});
