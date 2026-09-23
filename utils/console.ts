import { getErrorReporter } from "./error-reporter";
import { analyticsLogEvent } from "./firebase/analytics";

export const Console = {
    log: (message: string, ...optionalParams: any[]) => {
        if (__DEV__) {
            console.log(message, ...optionalParams);
        }
        // Recorded as a breadcrumb, so it shows up as context on the next error
        // rather than as an event of its own.
        //
        // This previously emitted an analytics event on EVERY log call. That
        // buried real funnels under log noise and ate into GA4's 500
        // distinct-event-name cap, so it is deliberately gone — use
        // Console.analytics() for anything that is genuinely an analytics event.
        try {
            getErrorReporter()?.addBreadcrumb(message, optionalParams);
        } catch (error) {
            console.error("Error recording log breadcrumb", error);
        }
    },
    error: (error: any, tag?: string) => {
        console.error((tag || "General Error"), error);
        try {
            getErrorReporter()?.captureException(error, tag);
        } catch (e) {
            console.error("Error reporting error", e);
        }
    },
    analytics: (
        eventName: string,
        eventParams: Record<string, any>
    ) => {
        try {
            return analyticsLogEvent(eventName, eventParams);
        } catch (error) {
            console.error("Error logging event to Analytics", error);
        }
    }
}
