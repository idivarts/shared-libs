import type {
    AnalyticsEventName,
    AnalyticsEventParams,
    AnalyticsPersonProperties,
    AnalyticsPersonPropertiesOnce,
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
    /**
     * Write properties onto the PERSON rather than onto events.
     *
     * Separate from `setContext` because the two answer different questions and
     * neither substitutes for the other: super-properties say what was true
     * when an event fired, while person properties are what a vendor can
     * filter and cohort PEOPLE by. Retention-by-plan needs the latter.
     *
     * `once` keys must be written only if currently absent (PostHog's
     * `$set_once`). A vendor without that distinction should write `props`
     * and ignore `once`, rather than overwrite a first-ever value on every
     * call — a shifting "first plan" is worse than a missing one.
     */
    setPersonProperties?: (
        props: AnalyticsPersonProperties,
        once?: AnalyticsPersonPropertiesOnce
    ) => void;
    reset?: () => void;
}

const sinks: AnalyticsSink[] = [];
let superProperties: AnalyticsSuperProperties = {};

/**
 * Events captured before any sink was registered.
 *
 * Without this they were dropped in silence. `track()` iterates the sinks that
 * exist at the moment it is called, and on a cold page load the vendor SDKs are
 * registered a beat after the first screens mount — so anything emitted from a
 * mount effect went nowhere. That silently cost the events most worth having:
 * the ones that fire when a screen is opened directly, by deep link, hard
 * refresh or a pasted URL, which is exactly how a funnel is entered.
 *
 * Verified on dev: `paywall_viewed` and `social_accounts_viewed` were absent on
 * a cold load of their screens and present on a warm in-app navigation to the
 * same screens.
 *
 * Buffering only ever happens while there are NO sinks, so this cannot grow
 * once the app has booted — the cap is a guard against a host that registers
 * none at all, not against ordinary traffic.
 */
const pending: { event: string; payload: Record<string, any> }[] = [];
const MAX_PENDING = 50;
/** Sinks that have already had the buffer replayed, so a re-register can't double-send. */
const replayed = new Set<string>();

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

    // Same principle one step further: events can also arrive before the sink.
    // Replayed per sink rather than drained once, because a second vendor
    // registering later was equally absent when these were captured.
    //
    // The payload is replayed as it was built, so the super-properties are the
    // ones that were true at capture time. The vendor will stamp its own
    // receipt time though, so a buffered event reads a beat late — a fraction
    // of a second in practice, and far better than not existing.
    if (pending.length > 0 && !replayed.has(sink.name)) {
        replayed.add(sink.name);
        for (const buffered of pending) {
            safely(sink.name, "track", () => sink.track(buffered.event, buffered.payload));
        }
    }
};

export const clearSinks = (): void => {
    sinks.length = 0;
    pending.length = 0;
    replayed.clear();
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

    // Nothing to deliver to yet — hold it for the sinks that are still booting
    // rather than discarding it. Oldest goes first if the cap is reached: a
    // host that never registers a sink is misconfigured, and in that case the
    // most recent events are the ones worth keeping.
    if (sinks.length === 0) {
        if (pending.length >= MAX_PENDING) pending.shift();
        pending.push({ event, payload });
        return;
    }

    for (const sink of sinks) {
        safely(sink.name, "track", () => sink.track(event, payload));
    }
}

/**
 * Write properties onto the current person.
 *
 * Sinks that have no notion of a person (Branch, Meta, Firebase) simply do not
 * implement this, so a caller never needs to know which vendors can take it.
 * Call it only once an identity exists — before `identify()` a vendor may
 * attach these to an anonymous profile that is later merged, or discard them.
 */
export const setPersonProperties = (
    props: AnalyticsPersonProperties,
    once?: AnalyticsPersonPropertiesOnce
): void => {
    for (const sink of sinks) {
        if (sink.setPersonProperties) {
            safely(sink.name, "setPersonProperties", () =>
                sink.setPersonProperties!(props, once)
            );
        }
    }
};

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
/**
 * Session context that describes the BUILD, not the person.
 *
 * reset() has to drop everything identity-scoped — org, brand, plan, campaign —
 * or the next user on the device inherits it. These are not that. They are set
 * once at bootstrap and are equally true for whoever signs in next.
 *
 * Clearing them cost real information: after a sign-out, every event up to the
 * next reload lost `environment` and `site`. Verified on dev — a signup done
 * straight after logging out produced signup_started, signup_email_submitted
 * and signup_email_registered with no environment at all, which makes a dev
 * row indistinguishable from a production one in exactly the funnel a release
 * is judged on.
 */
const STATIC_CONTEXT_KEYS = [
    "environment",
    "site",
    "platform",
    "app_version",
] as const satisfies readonly (keyof AnalyticsSuperProperties)[];

export const reset = (): void => {
    const retained: AnalyticsSuperProperties = {};
    for (const key of STATIC_CONTEXT_KEYS) {
        if (superProperties[key] !== undefined) {
            (retained as Record<string, unknown>)[key] = superProperties[key];
        }
    }
    superProperties = retained;
    // Anything still buffered belongs to the identity being dropped. Replaying
    // it after a sign-out would attribute the previous user's events to the
    // next one on the device, which is the whole thing reset() exists to stop.
    pending.length = 0;
    for (const sink of sinks) {
        if (sink.reset) safely(sink.name, "reset", () => sink.reset!());
    }
};
