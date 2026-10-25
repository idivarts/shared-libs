import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * Key/value storage that works on web and native, and never throws.
 *
 * ── Why every access is wrapped ─────────────────────────────────────────────
 * On web this used to touch `localStorage` directly. Reading that property is
 * not safe: when the browser blocks site data for the document — third-party
 * cookie blocking, Chrome's "Block all cookies", Safari private browsing with a
 * full quota, an embedded/iframed page — the *getter itself* throws
 * `SecurityError: Failed to read the 'localStorage' property from 'Window'`
 * (DOMException 18), and `setItem` additionally throws `QuotaExceededError`
 * once the store is full.
 *
 * Because these are `async` functions, a throw became a REJECTED PROMISE, and
 * the ~40 call sites across the app mostly call them as floating promises
 * (`PersistentStorage.set(...)` with no `await` and no `.catch`). Every one of
 * those surfaced as an unhandled rejection — five separate Sentry issues from
 * five different minified call sites, all the same root cause, all on users who
 * simply had site data blocked. Guarding at the call sites would mean auditing
 * all 40 and getting every future one right, so the guard belongs here: this is
 * the only module that knows a backing store can be absent.
 *
 * A `typeof localStorage !== "undefined"` test does NOT help — that expression
 * evaluates the same throwing getter. The access has to be inside try/catch.
 *
 * ── Degraded, not broken ────────────────────────────────────────────────────
 * When the real store is unavailable we fall back to an in-memory map rather
 * than dropping writes. Everything stored through here is soft state — the
 * selected brand, "guide tour seen" flags, a cached Stream token, suppression
 * timers — so losing it on reload is a mild annoyance, whereas losing it
 * *within* a session breaks flows that write a flag and read it back a moment
 * later (the onboarding brand selection being the one that crashed). Reads
 * therefore return null only when the key genuinely is not set anywhere.
 */

/** Fallback store for when the platform store is unreadable. Session-lifetime. */
const memoryStore = new Map<string, string>();

/**
 * Whether `window.localStorage` can actually be touched.
 *
 * Probed once and cached: the answer cannot change within a page lifetime, and
 * the probe itself is the thing that throws.
 */
let webStorage: Storage | null | undefined;

const getWebStorage = (): Storage | null => {
    if (webStorage !== undefined) return webStorage;
    try {
        // Reading `.localStorage` is the part that can throw, so it must happen
        // inside the try — not in a condition guarding it.
        const store = globalThis.localStorage;
        // A blocked store can also be present-but-unusable, so prove a write
        // round-trips before trusting it.
        const probe = "__trendly_storage_probe__";
        store.setItem(probe, "1");
        store.removeItem(probe);
        webStorage = store;
    } catch {
        webStorage = null;
    }
    return webStorage;
};

const isWeb = () => Platform.OS === "web";

export const PersistentStorage = {
    set: async (key: string, value: string) => {
        try {
            if (isWeb()) {
                const store = getWebStorage();
                if (store) {
                    store.setItem(key, value);
                    return;
                }
            } else {
                await AsyncStorage.setItem(key, value);
                return;
            }
        } catch {
            // Fall through to the in-memory store below. Deliberately silent:
            // blocked site data is a user setting, not a fault to report, and
            // this runs on paths that cannot show an error anyway.
        }
        memoryStore.set(key, value);
    },

    get: async (key: string): Promise<string | null> => {
        try {
            if (isWeb()) {
                const store = getWebStorage();
                if (store) return store.getItem(key);
            } else {
                return await AsyncStorage.getItem(key);
            }
        } catch {
            // Fall through to the in-memory store.
        }
        return memoryStore.get(key) ?? null;
    },

    clear: async (key: string) => {
        // Always clear the fallback too: a value may have landed there if an
        // earlier write failed, and a "clear" that leaves it readable is worse
        // than one that throws (this is what sign-out uses to drop a token).
        memoryStore.delete(key);
        try {
            if (isWeb()) {
                getWebStorage()?.removeItem(key);
            } else {
                await AsyncStorage.removeItem(key);
            }
        } catch {
            // Nothing left to do — the fallback copy is already gone.
        }
    },

    setItemWithExpiry: async (key: string, value: any, ttlInHours = 2) => {
        const now = new Date();
        const expiry = now.getTime() + ttlInHours * 60 * 60 * 1000;
        const item = JSON.stringify({ value, expiry });
        // Routed through set() rather than AsyncStorage directly so the web
        // build gets a real store instead of silently writing nowhere —
        // AsyncStorage on web is backed by localStorage and throws the same way.
        await PersistentStorage.set(key, item);
    },

    getItemWithExpiry: async (key: string): Promise<any | null> => {
        const item = await PersistentStorage.get(key);
        if (!item) return null;

        try {
            const { value, expiry } = JSON.parse(item);
            if (new Date().getTime() > expiry) {
                await PersistentStorage.clear(key);
                return null; // expired
            }
            return value;
        } catch {
            return null;
        }
    }
};
