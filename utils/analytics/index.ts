import type {
    AnalyticsEventName,
    AnalyticsEventParams,
    AnalyticsSuperProperties,
} from "@/shared-constants/analytics-events";

/**
 * Provider-agnostic analytics facade.
 *
 * Call sites depend only on this module, so adding, removing or swapping a
 * vendor is a one-file change instead of a sweep across ~30 components.
 *
 * Sinks are REGISTERED by the host app rather than imported here, for the same
 * reason shared-libs/utils/error-reporter.ts exists: Metro resolves imports at
 * bundle time, so importing a vendor SDK in shared-libs would force every host
 * app to install that dependency before it could build. Registering nothing
 * leaves every call below a silent no-op.
 */

export interface AnalyticsSink {
    /** Used only in warnings, so a failing vendor is identifiable. */
    readonly name: string;
    track: (event: string, props: Record<string, any>) => void;
    identify?: (userId: string, traits: Record<string, any>) => void;
    /**
     * Receive the session context whenever it changes, for vendors whose SDK
     * can hold it itself (PostHog's `register`, for instance).
     *
     * `track` already spreads the super-properties onto every event it sends,
     * so a sink needs this ONLY to reach the events it never sees: the ones the
     * vendor SDK raises on its own — `$exception`, app lifecycle, session
     * replay. Those are exactly the events where knowing the screen and the
     * plan matters most, which is why this exists rather than leaving the
     * props spread to do the job.
     *
     * Receives the full merged context, not the delta, so a sink registered
     * after some of it was already set still gets the whole picture.
     */
    setContext?: (props: AnalyticsSuperProperties) => void;
    reset?: () => void;
}

const sinks: AnalyticsSink[] = [];
let superProperties: AnalyticsSuperProperties = {};

/** One vendor throwing must never break another, nor the UI that emitted the event. */
const safely = (sinkName: string, op: string, fn: () => void): void => {
    try {
        fn();
    } catch (error) {
        console.warn(`[analytics] ${sinkName}.${op} failed`, error);
    }
};

/** Registered once per sink during app startup. Re-registering a name replaces it. */
export const registerSink = (sink: AnalyticsSink): void => {
    const existing = sinks.findIndex((s) => s.name === sink.name);
    if (existing >= 0) sinks[existing] = sink;
    else sinks.push(sink);

    // Sink registration and context can arrive in either order — attribution
    // resolves off a promise, org/brand mount deeper in the tree. Replaying
    // what is already known means a sink is never left behind whichever won.
    if (sink.setContext && Object.keys(superProperties).length > 0) {
        safely(sink.name, "setContext", () => sink.setContext!(getSuperProperties()));
    }
};

export const clearSinks = (): void => {
    sinks.length = 0;
};

/**
 * Merge values that should ride on every subsequent event. Called as auth, org
 * and brand context resolve, so it merges rather than replaces — each caller
 * only knows its own slice.
 */
export const setSuperProperties = (props: AnalyticsSuperProperties): void => {
    superProperties = { ...superProperties, ...props };
    for (const sink of sinks) {
        if (sink.setContext) {
            safely(sink.name, "setContext", () => sink.setContext!(getSuperProperties()));
        }
    }
};

export const getSuperProperties = (): AnalyticsSuperProperties => ({ ...superProperties });

/**
 * Emit an event to every registered sink.
 *
 * Generic over the registry in shared-constants/analytics-events.ts, so a
 * misspelled name or a missing/extra param is a compile error rather than a
 * malformed event discovered weeks later in a dashboard.
 */
export function track<E extends AnalyticsEventName>(
    event: E,
    props: AnalyticsEventParams[E]
): void {
    const payload = { ...superProperties, ...props };
    for (const sink of sinks) {
        safely(sink.name, "track", () => sink.track(event, payload));
    }
}

/** Bind subsequent events to a user. Call when auth resolves. */
export const identify = (userId: string, traits: Record<string, any> = {}): void => {
    for (const sink of sinks) {
        if (sink.identify) safely(sink.name, "identify", () => sink.identify!(userId, traits));
    }
};

/**
 * Drop the current identity and super-properties. Call on sign-out, otherwise
 * the next user on the device inherits the previous user's attribution.
 */
export const reset = (): void => {
    superProperties = {};
    for (const sink of sinks) {
        if (sink.reset) safely(sink.name, "reset", () => sink.reset!());
    }
};
