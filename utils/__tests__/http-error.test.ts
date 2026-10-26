// http-wrapper imports firebase/auth for the ID token, which pulls in
// AsyncStorage's native module. None of that is involved in building an error.
jest.mock("../firebase/auth", () => ({ AuthApp: null }));
jest.mock("../client-platform", () => ({ getClientPlatform: () => "web" }));

import { HttpError, HttpWrapper } from "../http-wrapper";

/**
 * Locks in why HttpError exists: `HttpWrapper.fetch` used to `throw response`,
 * a non-Error with no stack and an unread body, so every floating rejection in
 * the app collapsed into one Sentry group reading
 *
 *     Error: Object captured as exception with keys:
 *       _bodyBlob, _bodyInit, bodyUsed, headers
 *
 * The three properties that fixes depend on are asserted here: it IS an Error
 * (so it is captured with a stack), its message names the failure, and the body
 * is read exactly once up-front (so consumers and the reporter don't compete
 * for the single-use stream).
 */

const response = (status: number, body: string, contentType = "application/json") =>
    new Response(body, { status, headers: { "content-type": contentType } });

describe("HttpError", () => {
    it("is a real Error, so Sentry captures a stack and a usable title", async () => {
        const err = await HttpError.from(response(500, '{"message":"brand not found"}'), "/api/x", "POST");

        expect(err).toBeInstanceOf(Error);
        expect(err.stack).toBeTruthy();
        expect(err.name).toBe("HttpError");
        // Status, method and path in the title — the whole point, since the old
        // grouping could not tell one failing endpoint from another.
        expect(err.message).toContain("HTTP 500");
        expect(err.message).toContain("POST");
        expect(err.message).toContain("/api/x");
        expect(err.message).toContain("brand not found");
    });

    it("exposes status and the parsed body for callers that branch on them", async () => {
        const err = await HttpError.from(
            response(402, '{"error":"tokens_exhausted","message":"out of tokens"}'),
            "/api/render"
        );

        expect(err.status).toBe(402);
        expect(err.data.error).toBe("tokens_exhausted");
        expect(await HttpWrapper.extractErrorMessage(err)).toBe("out of tokens");
    });

    it("reads the body once, so consumers never hit a consumed stream", async () => {
        const res = response(500, '{"message":"boom"}');
        const err = await HttpError.from(res, "/api/x");

        expect(res.bodyUsed).toBe(true);
        // Two independent consumers both get the message — previously whoever
        // called .json() first won and everyone after got an empty body.
        expect(await HttpWrapper.extractErrorMessage(err)).toBe("boom");
        expect(await HttpWrapper.extractErrorMessage(err)).toBe("boom");
    });

    it("survives a non-JSON error page", async () => {
        const err = await HttpError.from(
            response(502, "<html>Bad Gateway</html>", "text/html"),
            "/api/x"
        );

        expect(err.status).toBe(502);
        expect(err.data).toBeNull();
        expect(err.message).toContain("Bad Gateway");
        expect(await HttpWrapper.extractErrorMessage(err)).toContain("Bad Gateway");
    });

    it("survives an empty body", async () => {
        const err = await HttpError.from(response(503, ""), "/api/x");

        expect(err.status).toBe(503);
        expect(err.body).toBe("");
        expect(err.data).toBeNull();
        expect(err.message).toBe("HTTP 503 GET /api/x");
    });

    it("truncates a long body so the Sentry title stays readable", async () => {
        const err = await HttpError.from(response(500, "x".repeat(5000), "text/plain"), "/api/x");
        expect(err.message.length).toBeLessThan(400);
        // The full body is still available to callers.
        expect(err.body.length).toBe(5000);
    });
});

describe("extractErrorMessage", () => {
    it("still handles the shapes it did before", async () => {
        expect(await HttpWrapper.extractErrorMessage("plain string")).toBe("plain string");
        expect(await HttpWrapper.extractErrorMessage(new Error("boom"))).toBe("boom");
        expect(await HttpWrapper.extractErrorMessage({ message: "from object" })).toBe("from object");
        expect(await HttpWrapper.extractErrorMessage({ error: "from error key" })).toBe("from error key");
        expect(await HttpWrapper.extractErrorMessage(null)).toBeNull();
    });

    it("still reads a bare Response, for code that throws one directly", async () => {
        expect(
            await HttpWrapper.extractErrorMessage(response(500, '{"message":"legacy"}'))
        ).toBe("legacy");
    });
});
