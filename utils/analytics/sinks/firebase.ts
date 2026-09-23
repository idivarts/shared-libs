import { analyticsLogEvent } from "../../firebase/analytics";
import type { AnalyticsSink } from "../index";

/**
 * Firebase / GA4 sink.
 *
 * Why GA4 is still here even though PostHog answers product questions better:
 * GA4 is what links natively to Google Ads for conversion import and audience
 * building. That link is the reason this sink exists — not its analysis tools.
 *
 * Platform split is inherited: ../../firebase/analytics has a `.native.ts`
 * counterpart, because firebase/analytics is a web-only SDK. On native this is
 * therefore a no-op by construction, which is fine — ads drive to web signup.
 */
export const firebaseSink: AnalyticsSink = {
    name: "firebase",

    track: (event, props) => {
        analyticsLogEvent(event, props);
    },

    // GA4's user identity is its own pseudonymous client id; setting a user id
    // requires the web SDK's setUserId, which the shared wrapper doesn't
    // expose. Deliberately omitted rather than half-implemented.
};
