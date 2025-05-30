import { analyticsLogEvent } from "./firebase/analytics";
import { CrashLog } from "./firebase/crashlytics";

export const Console = {
    log: (message: string, ...optionalParams: any[]) => {
        if (__DEV__) {
            console.log(message, ...optionalParams);
        }
        try {
            CrashLog.log(message, ...optionalParams);
            analyticsLogEvent("log", {
                message,
                optionalParams: optionalParams.join(" ")
            });
        } catch (error) {
            console.error("Error logging message to Crashlytics or Analytics", error);
        }
    },
    error: (error: any, tag?: string) => {
        console.error((tag || "General Error"), error);
        try {
            CrashLog.error(error, tag);
            analyticsLogEvent("error", {
                message: error instanceof Error ? error.message : String(error),
                tag: tag || "General Error"
            });
        } catch (e) {
            console.error("Error logging error to Crashlytics or Analytics", e);
        }
    }
}