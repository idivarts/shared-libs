/**
 * Locks in the contract that PersistentStorage never throws on web.
 *
 * The bug this guards against produced five separate Sentry issues at once:
 * reading `window.localStorage` throws `SecurityError` (DOMException 18) when
 * the browser blocks site data for the document, and because these are `async`
 * functions called mostly as floating promises, every throw became an unhandled
 * rejection.
 *
 * The subtlety worth a test: a `typeof localStorage !== "undefined"` guard does
 * NOT prevent this, because evaluating that expression calls the same throwing
 * getter. So the "blocked" case here is modelled as a THROWING PROPERTY, not a
 * missing one.
 */

// The module caches its localStorage probe and holds the in-memory fallback at
// module scope, so each case needs a fresh copy. `require` inside
// isolateModules rather than a dynamic `import()`, which this CJS jest
// transform cannot do.
const freshModule = (): typeof import("../persistent-storage") => {
    let mod: typeof import("../persistent-storage");
    jest.isolateModules(() => {
        mod = require("../persistent-storage");
    });
    return mod!;
};

/** Replaces globalThis.localStorage with a getter that throws, as Chrome does. */
const withBlockedLocalStorage = () => {
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get() {
            throw new DOMException(
                "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
                "SecurityError"
            );
        },
    });
};

/** Replaces it with a plain working in-memory implementation. */
const withWorkingLocalStorage = () => {
    const map = new Map<string, string>();
    const store = {
        getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
    };
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get: () => store,
    });
    return map;
};

jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
jest.mock("@react-native-async-storage/async-storage", () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

afterEach(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete (globalThis as any).localStorage;
});

describe("PersistentStorage with localStorage blocked", () => {
    it("does not reject on set, get or clear", async () => {
        withBlockedLocalStorage();
        const { PersistentStorage } = freshModule();

        await expect(PersistentStorage.set("k", "v")).resolves.toBeUndefined();
        await expect(PersistentStorage.get("k")).resolves.toBe("v");
        await expect(PersistentStorage.clear("k")).resolves.toBeUndefined();
    });

    it("round-trips through the in-memory fallback within a session", async () => {
        withBlockedLocalStorage();
        const { PersistentStorage } = freshModule();

        await PersistentStorage.set("selectedBrandId", "brand-1");
        // The onboarding flow writes a flag and reads it back moments later;
        // returning null there is what broke it.
        expect(await PersistentStorage.get("selectedBrandId")).toBe("brand-1");

        await PersistentStorage.clear("selectedBrandId");
        expect(await PersistentStorage.get("selectedBrandId")).toBeNull();
    });

    it("returns null for a key that was never set", async () => {
        withBlockedLocalStorage();
        const { PersistentStorage } = freshModule();
        expect(await PersistentStorage.get("never-set")).toBeNull();
    });

    it("still honours expiry", async () => {
        withBlockedLocalStorage();
        const { PersistentStorage } = freshModule();

        await PersistentStorage.setItemWithExpiry("cached", ["a", "b"], 1);
        expect(await PersistentStorage.getItemWithExpiry("cached")).toEqual(["a", "b"]);

        // Negative TTL ⇒ already expired.
        await PersistentStorage.setItemWithExpiry("stale", "x", -1);
        expect(await PersistentStorage.getItemWithExpiry("stale")).toBeNull();
    });
});

describe("PersistentStorage with localStorage available", () => {
    it("writes through to the real store", async () => {
        const map = withWorkingLocalStorage();
        const { PersistentStorage } = freshModule();

        await PersistentStorage.set("k", "v");
        expect(map.get("k")).toBe("v");
        expect(await PersistentStorage.get("k")).toBe("v");

        await PersistentStorage.clear("k");
        expect(map.has("k")).toBe(false);
    });

    it("uses the raw key, so values written before this change are still found", async () => {
        const map = withWorkingLocalStorage();
        // AsyncStorage's web backend also uses localStorage with the unprefixed
        // key, so routing the expiry helpers through set/get kept the namespace.
        map.set("suppress_lets_start", JSON.stringify({ value: "true", expiry: Date.now() + 60_000 }));
        const { PersistentStorage } = freshModule();

        expect(await PersistentStorage.getItemWithExpiry("suppress_lets_start")).toBe("true");
    });
});
