import { Dimensions, Platform } from "react-native";

/**
 * Which client a request came from. Sent on every backend call as the
 * X-Client-Platform header and recorded (throttled) against the manager, so the
 * admin Brand CRM can show how customers actually reach the product.
 *
 * Keep these values in sync with `allowedClientPlatforms` in
 * backend-sls/internal/middlewares/trendly_mw.go — the backend drops anything
 * it does not recognise.
 */
export type ClientPlatform = "ios" | "android" | "web-desktop" | "web-mobile";

/**
 * The width at or above which web counts as desktop. Matches the `xl`
 * breakpoint in `use-breakpoints.tsx`, so this classification lines up with
 * where the app actually switches to its desktop layout.
 */
const DESKTOP_MIN_WIDTH = 1024;

/**
 * Returns the current client platform.
 *
 * Note: this reads `Dimensions` directly rather than `useBreakpoints()`. The
 * project rule against `Dimensions` covers responsive layout inside
 * components; this is one-off telemetry called from `HttpWrapper.fetch`, which
 * is plain module code outside React, so a hook is not usable here.
 */
export const getClientPlatform = (): ClientPlatform => {
    if (Platform.OS === "ios") return "ios";
    if (Platform.OS === "android") return "android";

    // Anything else (web, and any future target) is classified by viewport.
    return Dimensions.get("window").width >= DESKTOP_MIN_WIDTH
        ? "web-desktop"
        : "web-mobile";
};
