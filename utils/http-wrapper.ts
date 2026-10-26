import { getClientPlatform } from "./client-platform";
import { IS_DEV } from "./environment";
import { AuthApp } from "./firebase/auth";


const BASE_URL = `https://be.trendly.now${IS_DEV ? "/dev" : ""}`;

/** How much of a response body to keep in the error message. */
const BODY_SNIPPET_LIMIT = 300;

/**
 * A failed backend call, as a real `Error`.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * `HttpWrapper.fetch` used to `throw response` — the bare `Response` object.
 * That is not an `Error`, which has two consequences:
 *
 *  1. NO STACK TRACE. A `Response` is created inside `fetch`, so it carries no
 *     call site. Any one of the ~118 `HttpWrapper.fetch` callers that lets the
 *     rejection float produced a Sentry issue reading
 *
 *         Error: Object captured as exception with keys:
 *           _bodyBlob, _bodyInit, bodyUsed, headers
 *
 *     with "No stacktrace available" — every failing endpoint in the app
 *     collapsed into one unactionable group. (Sentry stringifies a thrown
 *     non-Error; on the web build the same thing surfaced as `Error: [object
 *     Response]`.) An `Error` subclass is captured with the throwing frame, so
 *     the issue names the call site.
 *  2. THE REASON WAS THROWN AWAY. The status and the server's message live in
 *     the response, and a body can be read only once — so whichever consumer
 *     read it first won, and Sentry (which never reads it) always lost.
 *
 * So the body is read ONCE, here, and folded into `message`. That makes the
 * Sentry title the actual failure ("HTTP 500 POST /api/collabs/... — …") and
 * means consumers never have to touch the stream.
 *
 * `response` is still exposed for headers and the like, but its body is already
 * consumed — read `body` / `data` instead of calling `.json()` on it.
 */
export class HttpError extends Error {
    /** HTTP status, e.g. 402, 500. */
    readonly status: number;
    /** Request path as passed to `fetch`, e.g. "/api/collabs/collaborations". */
    readonly path: string;
    /** Raw response body text, "" when it was empty or unreadable. */
    readonly body: string;
    /** `body` parsed as JSON, or null when it was not JSON. */
    readonly data: any | null;
    /** The original response. Its body is already consumed. */
    readonly response: Response;

    private constructor(
        message: string,
        init: { status: number; path: string; body: string; data: any | null; response: Response }
    ) {
        super(message);
        this.name = "HttpError";
        this.status = init.status;
        this.path = init.path;
        this.body = init.body;
        this.data = init.data;
        this.response = init.response;
    }

    /**
     * Build an HttpError from a failed response, draining its body.
     *
     * Async because reading the body is — which is why `fetch` below awaits it
     * before throwing.
     */
    static async from(response: Response, path: string, method = "GET"): Promise<HttpError> {
        let body = "";
        try {
            body = await response.text();
        } catch {
            // A body that cannot be read must not mask the HTTP failure itself.
        }

        let data: any | null = null;
        try {
            data = body ? JSON.parse(body) : null;
        } catch {
            // Plain-text or HTML error page — `body` still carries it.
        }

        // Prefer the server's own wording; it is what makes the Sentry title
        // and any surfaced toast specific.
        const reason =
            (typeof data === "string" ? data : data?.message ?? data?.error) ??
            body;
        const snippet = reason
            ? ` — ${String(reason).slice(0, BODY_SNIPPET_LIMIT)}`
            : "";

        return new HttpError(
            `HTTP ${response.status} ${method} ${path}${snippet}`,
            { status: response.status, path, body, data, response }
        );
    }
}

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
                // Lets the backend record which client the user is on (see
                // middlewares.ClientPlatformHeader). Purely informational — no
                // endpoint behaviour depends on it.
                "X-Client-Platform": getClientPlatform(),
            },
        });
        if (response.status >= 300) {
            throw await HttpError.from(response, urlPath, init?.method ?? "GET");
        }
        return response
    }

    /**
     * Extracts a user-facing error message from various error shapes:
     * - HttpError thrown by HttpWrapper.fetch (uses the already-read body)
     * - Response objects (for code that still throws one directly)
     * - Error instances
     * - Plain strings
     * - Objects with `message` or `error` fields (common API response shapes)
     */
    public static extractErrorMessage = async (error: unknown): Promise<string | null> => {
        if (!error) return null;
        if (typeof error === "string") return error;

        // Before the generic `instanceof Error` branch: an HttpError's `message`
        // is prefixed with "HTTP <status> <method> <path>", which is right for a
        // Sentry title and wrong for a toast. The parsed body is the user-facing
        // half.
        if (error instanceof HttpError) {
            const { data, body } = error;
            if (typeof data === "string") return data;
            if (data?.message) return String(data.message);
            if (data?.error) return String(data.error);
            return body || null;
        }

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
