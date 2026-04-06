/**
 * User-facing http(s) link validation and normalization.
 * Uses the WHATWG URL parser; only http and https are accepted.
 */

function looksLikeHasScheme(value: string): boolean {
    return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

/**
 * Prepends https:// when the user omitted the scheme (e.g. "example.com/path").
 */
export function normalizeHttpUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
        return "";
    }
    return looksLikeHasScheme(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Returns true when the value is a valid http(s) URL with a non-empty host.
 */
export function isValidHttpUrl(raw: string): boolean {
    const trimmed = raw.trim();
    if (!trimmed) {
        return false;
    }

    const candidate = normalizeHttpUrl(trimmed);

    let parsed: URL;
    try {
        parsed = new URL(candidate);
    } catch {
        return false;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return false;
    }

    const host = parsed.hostname;
    if (!host) {
        return false;
    }

    return true;
}
