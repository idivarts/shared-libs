import {
    clearSinks,
    registerSink,
    reset,
    setSuperProperties,
    track,
} from "@/shared-libs/utils/analytics";

/**
 * The pre-sink buffer.
 *
 * `track()` can only deliver to the sinks that exist when it is called, and on
 * a cold page load the vendor SDKs register a beat after the first screens
 * mount. Before the buffer, anything emitted from a mount effect was discarded
 * in silence — which cost precisely the events that fire when a screen is
 * opened directly, by deep link or hard refresh.
 */
const makeSink = (name: string) => {
    const captured: { event: string; props: Record<string, any> }[] = [];
    return {
        sink: {
            name,
            track: (event: string, props: Record<string, any>) =>
                captured.push({ event, props }),
        },
        captured,
    };
};

describe("analytics pre-sink buffer", () => {
    beforeEach(() => {
        clearSinks();
        reset();
    });

    it("replays events captured before any sink registered", () => {
        track("screen_viewed", { path: "/billing" });

        const { sink, captured } = makeSink("posthog");
        expect(captured).toHaveLength(0);

        registerSink(sink);

        expect(captured).toHaveLength(1);
        expect(captured[0].event).toBe("screen_viewed");
        expect(captured[0].props).toMatchObject({ path: "/billing" });
    });

    it("replays the buffer into a second sink that registers later", () => {
        track("screen_viewed", { path: "/billing" });

        const first = makeSink("posthog");
        registerSink(first.sink);
        const second = makeSink("branch");
        registerSink(second.sink);

        // Both were equally absent when the event was captured.
        expect(first.captured).toHaveLength(1);
        expect(second.captured).toHaveLength(1);
    });

    it("does not re-send to a sink that re-registers under the same name", () => {
        track("screen_viewed", { path: "/billing" });

        const { sink, captured } = makeSink("posthog");
        registerSink(sink);
        registerSink(sink);

        expect(captured).toHaveLength(1);
    });

    it("stops buffering once a sink exists, so live events are not replayed", () => {
        const { sink, captured } = makeSink("posthog");
        registerSink(sink);

        track("screen_viewed", { path: "/a" });
        track("screen_viewed", { path: "/b" });

        const late = makeSink("branch");
        registerSink(late.sink);

        expect(captured).toHaveLength(2);
        // Nothing was buffered while a sink existed, so the late sink gets none.
        expect(late.captured).toHaveLength(0);
    });

    it("preserves the super-properties that were true at capture time", () => {
        setSuperProperties({ environment: "dev", plan_key: "free" });
        track("screen_viewed", { path: "/billing" });
        setSuperProperties({ plan_key: "pro" });

        const { sink, captured } = makeSink("posthog");
        registerSink(sink);

        expect(captured[0].props).toMatchObject({
            environment: "dev",
            plan_key: "free",
        });
    });

    it("drops the buffer on reset, so a signed-out user's events are not attributed to the next one", () => {
        track("screen_viewed", { path: "/billing" });
        reset();

        const { sink, captured } = makeSink("posthog");
        registerSink(sink);

        expect(captured).toHaveLength(0);
    });

    it("caps the buffer and keeps the most recent events", () => {
        for (let i = 0; i < 60; i++) track("screen_viewed", { path: `/p${i}` });

        const { sink, captured } = makeSink("posthog");
        registerSink(sink);

        expect(captured).toHaveLength(50);
        expect(captured[captured.length - 1].props).toMatchObject({ path: "/p59" });
    });
});
