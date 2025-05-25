import { getCrashlytics } from "@react-native-firebase/crashlytics";
import { Platform } from "react-native";

const crashlytics = Platform.OS != "web" ? getCrashlytics() : null;
crashlytics?.setCrashlyticsCollectionEnabled(true);

export class CrashLog {
    public static log(message: string, tag?: string): void {
        if (tag)
            console.log(message)
        else
            console.log(tag, message);
        if (crashlytics) crashlytics.log(message);
    }
    public static crash(): void {
        if (crashlytics && crashlytics.isCrashlyticsCollectionEnabled) {
            console.log("Crashing the app for testing purposes");
            crashlytics.crash();
        }
    }
    public static error(error: Error, tag?: string): void {
        if (tag)
            console.error(error);
        else
            console.error(tag, error);
        if (crashlytics) crashlytics.recordError(error);
    }
}