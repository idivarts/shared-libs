/**
 * Canonical social-platform enum for content planning & publishing.
 *
 * Values are the stable lowercase keys used everywhere else in the platform —
 * `ISocialAccount.platform`, `ContentDestination.platform`, the backend
 * `trendlymodels.Platform` const set, and `constants/Socials.ts`
 * (`SOCIAL_PLATFORMS`). The legacy UPPERCASE `SocialPlatform` enum in
 * `./social-platform.ts` is kept only for old call-sites; new code uses this.
 */
export enum PlatformEnum {
    Instagram = "instagram",
    Facebook = "facebook",
    YouTube = "youtube",
    LinkedIn = "linkedin",
    Twitter = "twitter",
}

/** String-literal union of every {@link PlatformEnum} value. */
export type Platform = `${PlatformEnum}`;

/** Every platform key, in canonical display order. */
export const ALL_PLATFORMS: Platform[] = Object.values(PlatformEnum);

/**
 * Coerce a free-form / legacy platform string into a canonical {@link Platform}.
 * Handles the old capitalised content values (e.g. `"Instagram"`) and the
 * `"X / Twitter"` label. Returns `undefined` when the value is unrecognised.
 */
export function normalizePlatform(value: string | null | undefined): Platform | undefined {
    if (!value) return undefined;
    const v = value.trim().toLowerCase();
    if (v === "x" || v === "x / twitter" || v === "twitter/x") return PlatformEnum.Twitter;
    return (ALL_PLATFORMS as string[]).includes(v) ? (v as Platform) : undefined;
}

/** Coerce a list of legacy/mixed platform strings, dropping unknowns + dupes. */
export function normalizePlatforms(values: (string | null | undefined)[] | null | undefined): Platform[] {
    if (!values) return [];
    const out: Platform[] = [];
    for (const raw of values) {
        const p = normalizePlatform(raw);
        if (p && !out.includes(p)) out.push(p);
    }
    return out;
}
