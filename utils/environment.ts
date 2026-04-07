export const IS_DEV = __DEV__ || process.env.EXPO_PUBLIC_APP_STAGE == "dev";

export const IS_LIVE = !IS_DEV;