import { getCrashlytics } from "@react-native-firebase/crashlytics";

const crashlytics = getCrashlytics();

export class CrashLog {
    public static log(message: string, tag?: string): void {
        if (tag)
            console.log(message)
        else
            console.log(tag, message);
        crashlytics.log(message);
    }
    public static crash(): void {
        console.log("Crashing the app for testing purposes");
        crashlytics.crash();
    }
    public static error(error: Error, tag?: string): void {
        if (tag)
            console.error(error);
        else
            console.error(tag, error);
        crashlytics.recordError(error);
    }
}