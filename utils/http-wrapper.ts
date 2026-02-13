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
}
export { BASE_URL as BACKEND_URL };
