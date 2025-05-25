import { getCrashlytics } from "@react-native-firebase/crashlytics";
import { Platform } from "react-native";

const crashlytics = Platform.OS != "web" ? getCrashlytics() : null;
crashlytics?.setCrashlyticsCollectionEnabled(true);

export class CrashLog {
    public static log(message: string, ...optionalParams: any[]): void {
        console.log(message, optionalParams);
        if (optionalParams && optionalParams.length > 0) {
            message += " " + optionalParams.join(" ");
        }
        if (crashlytics) crashlytics.log("" + message);
    }
    public static crash(): void {
        if (crashlytics && crashlytics.isCrashlyticsCollectionEnabled) {
            console.log("Crashing the app for testing purposes");
            crashlytics.crash();
        }
    }
    public static error(error: any, tag?: string): void {
        if (tag)
            console.error(error);
        else
            console.error(tag, error);
        if (crashlytics) {
            if (error instanceof Error) {
                crashlytics.recordError(error, tag);
            } else if (typeof error === "string") {
                crashlytics.recordError(new Error(error), tag);
            } else if (error instanceof Object) {
                crashlytics.recordError(new Error(JSON.stringify(error)), tag);
            } else {
                crashlytics.log(tag + " : " + error)
            }
        };
    }
}