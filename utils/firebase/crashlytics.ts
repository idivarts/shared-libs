export class CrashLog {
    public static log(message: string, ...optionalParams: any[]): void {
        if (optionalParams && optionalParams.length > 0) {
            message += " " + optionalParams.join(" ");
        }
    }
    public static crash(): void {
        console.log("Trying to Crash the app");
    }
    public static error(error: any, tag?: string): void {
        console.log(tag + " : " + error)
    }
}