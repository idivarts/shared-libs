import { ALL_PLATFORMS, Platform, PlatformEnum } from "./platform";

/**
 * Canonical content-format enum. A content piece has exactly ONE format but may
 * target MANY platforms (see {@link FORMAT_PLATFORM_SUPPORT}).
 *
 * Video formats are split by aspect ratio:
 *  - `Reel`  = portrait / short-form vertical video (IG & FB Reels, YouTube Shorts)
 *  - `Video` = landscape / long-form 16:9 video (YouTube, Facebook, LinkedIn, X,
 *              and Instagram as a feed video — not a Reel)
 */
export enum ContentFormatEnum {
    Post = "post",
    Reel = "reel",
    Video = "video",
    Story = "story",
    Carousel = "carousel",
    Live = "live",
    Text = "text",
}

/** String-literal union of every {@link ContentFormatEnum} value. */
export type ContentFormat = `${ContentFormatEnum}`;

/** Every content format, in canonical display order. */
export const ALL_CONTENT_FORMATS: ContentFormat[] = Object.values(ContentFormatEnum);

/** Human-readable labels for each format. */
export const CONTENT_FORMAT_LABELS: Record<ContentFormat, string> = {
    post: "Post",
    reel: "Reel",
    video: "Video",
    story: "Story",
    carousel: "Carousel",
    live: "Live",
    text: "Text Post",
};

/**
 * Which platforms support each content format — the single source of truth for
 * the platform↔format restriction. A content's targeted platforms must all
 * support its chosen format. Mirrored on the backend in
 * `internal/models/trendlymodels/content_format.go` — keep the two in sync.
 *
 * Confirmed matrix (2026-06-17):
 *  - post:     all except YouTube
 *  - reel:     all (YouTube = Shorts)
 *  - video:    all (Instagram = feed video, not a Reel)
 *  - story:    Instagram + Facebook only
 *  - carousel: Instagram, Facebook, LinkedIn
 *  - live:     all except X/Twitter
 *  - text:     Facebook, LinkedIn, X/Twitter (Instagram cannot do a text post)
 */
export const FORMAT_PLATFORM_SUPPORT: Record<ContentFormat, Platform[]> = {
    post: [PlatformEnum.Instagram, PlatformEnum.Facebook, PlatformEnum.LinkedIn, PlatformEnum.Twitter],
    reel: [PlatformEnum.Instagram, PlatformEnum.Facebook, PlatformEnum.YouTube, PlatformEnum.LinkedIn, PlatformEnum.Twitter],
    video: [PlatformEnum.Instagram, PlatformEnum.Facebook, PlatformEnum.YouTube, PlatformEnum.LinkedIn, PlatformEnum.Twitter],
    story: [PlatformEnum.Instagram, PlatformEnum.Facebook],
    carousel: [PlatformEnum.Instagram, PlatformEnum.Facebook, PlatformEnum.LinkedIn],
    live: [PlatformEnum.Instagram, PlatformEnum.Facebook, PlatformEnum.YouTube, PlatformEnum.LinkedIn],
    text: [PlatformEnum.Facebook, PlatformEnum.LinkedIn, PlatformEnum.Twitter],
};

/** Platforms that support the given content format. */
export function platformsForFormat(format: ContentFormat): Platform[] {
    return FORMAT_PLATFORM_SUPPORT[format] ?? [];
}

/** Content formats supported by the given platform. */
export function formatsForPlatform(platform: Platform): ContentFormat[] {
    return ALL_CONTENT_FORMATS.filter((f) => FORMAT_PLATFORM_SUPPORT[f].includes(platform));
}

/** Whether a (format, platform) pair is allowed. */
export function isFormatPlatformCompatible(format: ContentFormat, platform: Platform): boolean {
    return platformsForFormat(format).includes(platform);
}

/**
 * The subset of `platforms` that are incompatible with `format`. Empty array
 * means the whole selection is valid. Useful for surfacing which chips to
 * disable / which selection to reject.
 */
export function incompatiblePlatforms(format: ContentFormat, platforms: Platform[]): Platform[] {
    const allowed = platformsForFormat(format);
    return platforms.filter((p) => !allowed.includes(p));
}

/**
 * Coerce a free-form / legacy content-format string into a canonical
 * {@link ContentFormat}, falling back to `Post` for unknown values. The old
 * model stored lowercase-ish strings ("post", "reel", …) so this is mostly a
 * validation pass.
 */
export function normalizeContentFormat(value: string | null | undefined): ContentFormat {
    if (!value) return ContentFormatEnum.Post;
    const v = value.trim().toLowerCase();
    return (ALL_CONTENT_FORMATS as string[]).includes(v) ? (v as ContentFormat) : ContentFormatEnum.Post;
}

// Re-export platform helpers so callers can import everything format-related
// from one module.
export { ALL_PLATFORMS, PlatformEnum };
export type { Platform };
