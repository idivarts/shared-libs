// const crashlytics = getCrashlytics();
// crashlytics?.setCrashlyticsCollectionEnabled(true);

const crashlytics: any = null;
export class CrashLog {
    public static log(message: string, ...optionalParams: any[]): void {
        if (optionalParams && optionalParams.length > 0) {
            message += " " + optionalParams.join(" ");
        }
        if (crashlytics) crashlytics.log("" + message);
    }
    public static crash(): void {
        if (crashlytics && crashlytics.isCrashlyticsCollectionEnabled) {
            crashlytics.crash();
        }
    }
    public static error(error: any, tag?: string): void {
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