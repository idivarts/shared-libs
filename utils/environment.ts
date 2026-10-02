export const IS_DEV = __DEV__ || process.env.EXPO_PUBLIC_APP_STAGE == "dev";

export const IS_LIVE = !IS_DEV;

/**
 * Canonical stage name, used wherever an external system needs to segment this
 * app's data by environment (Sentry's `environment`, the analytics
 * `environment` super-property, Branch's test/live instance).
 *
 * Deliberately "dev" / "prod" — the same two strings the backend's STAGE env
 * var uses — so a filter written in one tool reads the same in another.
 */
export const APP_STAGE: "dev" | "prod" = IS_DEV ? "dev" : "prod";
