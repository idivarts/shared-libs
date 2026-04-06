import { AuthApp } from "./firebase/auth";

let IS_DEV = __DEV__ || process.env.EXPO_PUBLIC_APP_STAGE == "dev";;
const BASE_URL = `https://be.trendly.now${IS_DEV ? "/dev" : ""}`;

export class HttpWrapper {
    public static fetch = async (urlPath: string, init?: RequestInit, idToken = ""): Promise<Response> => {
        if (!idToken && AuthApp && AuthApp.currentUser) {
            idToken = await AuthApp.currentUser.getIdToken();
        }
        const response = await fetch(BASE_URL + urlPath, {
            ...init,
            headers: {
                ...init?.headers,
                ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
        });
        if (response.status >= 300) {
            throw response;
        }
        return response
    }

    /**
     * Extracts a user-facing error message from various error shapes:
     * - Response objects thrown by HttpWrapper.fetch (reads and parses body)
     * - Error instances
     * - Plain strings
     * - Objects with `message` or `error` fields (common API response shapes)
     */
    public static extractErrorMessage = async (error: unknown): Promise<string | null> => {
        if (!error) return null;
        if (typeof error === "string") return error;

        if (error instanceof Response) {
            try {
                const body = await error.text();
                try {
                    const parsed = JSON.parse(body);
                    if (typeof parsed === "string") return parsed;
                    if (parsed?.message) return String(parsed.message);
                    if (parsed?.error) return String(parsed.error);
                } catch {
                    return body || null;
                }
            } catch {
                return null;
            }
        }

        if (error instanceof Error) return error.message;

        if (typeof error === "object" && error !== null) {
            if ("message" in error) return String((error as Record<string, unknown>).message);
            if ("error" in error) return String((error as Record<string, unknown>).error);
        }

        return null;
    }
}
export { BASE_URL as BACKEND_URL };
