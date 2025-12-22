import { Platform } from "react-native";
import { AuthApp } from "./firebase/auth";

let IS_DEV = false;
if (Platform.OS === "web") {
    const HOST_NAME = window.location.hostname;
    IS_DEV = HOST_NAME.startsWith("localhost") || HOST_NAME.startsWith("dev.")
} else {
    // Figure out a way to know if the app is in testflight or in internal testing or in dev mode
    IS_DEV = __DEV__ || process.env.EXPO_APP_STAGE == "dev";
}
const BASE_URL = `https://be.trendly.now${IS_DEV ? "/dev" : ""}`;

export class HttpWrapper {
    public static fetch = async (urlPath: string, init?: RequestInit, idToken = ""): Promise<Response> => {
        if (AuthApp && AuthApp.currentUser) {
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
}
export { BASE_URL as BACKEND_URL };
