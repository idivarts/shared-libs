import { AuthApp } from "./firebase/auth";

// const HOST_NAME = window.location.hostname;
// const IS_DEV = HOST_NAME.startsWith("localhost") || HOST_NAME.startsWith("dev.")
// const BASE_URL = `https://be.trendly.now${IS_DEV ? "/dev" : ""}`;
const BASE_URL = `https://be.trendly.now`;

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
