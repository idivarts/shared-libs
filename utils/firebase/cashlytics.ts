import { getCrashlytics } from "@react-native-firebase/crashlytics";

const crashlytics = getCrashlytics();

export class CrashLog {
    public static log(message: string): void {
        console.log(message)
        crashlytics.log(message);
    }
    public static crash(): void {
        console.log("Crashing the app for testing purposes");
        crashlytics.crash();
    }
    public static error(error: Error): void {
        console.error(error);
        crashlytics.recordError(error);
    }
}