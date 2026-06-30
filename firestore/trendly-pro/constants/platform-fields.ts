/**
 * PLATFORM_FIELD_REGISTRY — the single, config-driven source of truth for the
 * platform-specific publishing fields rendered inline on a content variation's
 * tab (and the caption constraints validated per platform).
 *
 * The variation editor renders fields straight from this registry, so no
 * per-platform field UI is hardcoded in components. Character limits / hashtag
 * caps live here (not in components) and are intentionally easy to retune —
 * platforms change them often. Mirror any field-key change in the backend
 * `ContentPlatformOptions` struct (content.go) and the publish resolver.
 *
 * Scope: only the platforms Trendly can currently connect & publish to. TikTok /
 * Pinterest / Threads / GBP are documented in the ticket but not wired here.
 */
import { IPlatformOptions } from "../models/contents";
import { Platform, PlatformEnum } from "./platform";

/** The input control the variation editor should render for a field. */
export type PlatformFieldType =
    | "text" // single-line string
    | "textarea" // multi-line string
    | "select" // one of `options`
    | "toggle" // boolean
    | "tags" // string[] entered as comma/space separated chips
    | "thread"; // Twitter multi-tweet thread (string[])

export interface PlatformFieldDef {
    /** Key into IPlatformOptions this field reads/writes. */
    key: keyof IPlatformOptions;
    label: string;
    type: PlatformFieldType;
    placeholder?: string;
    /** Max characters for text/textarea fields. */
    maxLen?: number;
    /** Options for a `select` field. */
    options?: { label: string; value: string }[];
    /** Short helper text shown under the field. */
    hint?: string;
    /** Whether the field is required for a valid publish to this platform. */
    required?: boolean;
    /**
     * Whether this field can actually be set through the platform's official
     * publishing API. When false the editor surfaces a "set manually" note so the
     * user isn't misled (e.g. Instagram collaborators).
     */
    settable?: boolean;
}

/** Caption/body constraints + extra fields for one platform's variation. */
export interface PlatformVariationSpec {
    platform: Platform;
    /** Label for the shared caption/body on this platform ("Caption" vs "Post"). */
    captionLabel: string;
    /** Hard max characters for the caption/body. */
    captionMaxLen: number;
    /** Recommended max hashtags (soft — surfaced as a hint), if meaningful. */
    hashtagMax?: number;
    /** One-line note about the platform's caption behaviour. */
    captionNote?: string;
    /** Inline platform-specific option fields, in display order. */
    fields: PlatformFieldDef[];
}

const YT_PRIVACY = [
    { label: "Public", value: "public" },
    { label: "Unlisted", value: "unlisted" },
    { label: "Private", value: "private" },
];

const LI_VISIBILITY = [
    { label: "Public", value: "PUBLIC" },
    { label: "Connections", value: "CONNECTIONS" },
    { label: "Members", value: "LOGGED_IN" },
];

const X_REPLY = [
    { label: "Everyone", value: "everyone" },
    { label: "Following", value: "following" },
    { label: "Mentioned", value: "mentionedUsers" },
    { label: "Subscribers", value: "subscribers" },
];

export const PLATFORM_FIELD_REGISTRY: Record<Platform, PlatformVariationSpec> = {
    [PlatformEnum.Instagram]: {
        platform: PlatformEnum.Instagram,
        captionLabel: "Caption",
        captionMaxLen: 2200,
        hashtagMax: 30,
        captionNote: "Up to 2,200 chars · max 30 hashtags · links aren't clickable in captions.",
        fields: [
            { key: "instagramLocation", label: "Location", type: "text", placeholder: "e.g. Mumbai, India" },
            { key: "instagramAltText", label: "Alt text", type: "text", placeholder: "Describe the image for accessibility", maxLen: 1000 },
            { key: "instagramFirstComment", label: "First comment", type: "textarea", placeholder: "Posted as the first comment (great for hashtags)", maxLen: 2200 },
        ],
    },
    [PlatformEnum.Facebook]: {
        platform: PlatformEnum.Facebook,
        captionLabel: "Post text",
        captionMaxLen: 63206,
        captionNote: "Links are clickable and auto-generate a preview.",
        fields: [
            { key: "facebookFirstComment", label: "First comment", type: "textarea", placeholder: "Posted as the first comment", maxLen: 8000 },
        ],
    },
    [PlatformEnum.LinkedIn]: {
        platform: PlatformEnum.LinkedIn,
        captionLabel: "Post",
        captionMaxLen: 3000,
        captionNote: "Up to 3,000 chars. URLs are clickable.",
        fields: [
            { key: "linkedinVisibility", label: "Visibility", type: "select", options: LI_VISIBILITY, hint: "Who can see this post." },
            { key: "linkedinAltText", label: "Alt text", type: "text", placeholder: "Describe the image for accessibility", maxLen: 1000 },
            { key: "linkedinFirstComment", label: "First comment", type: "textarea", placeholder: "Posted as the first comment", maxLen: 1250 },
        ],
    },
    [PlatformEnum.LinkedInPage]: {
        platform: PlatformEnum.LinkedInPage,
        captionLabel: "Post",
        captionMaxLen: 3000,
        captionNote: "Posts to your company page. Up to 3,000 chars.",
        fields: [
            { key: "linkedinVisibility", label: "Visibility", type: "select", options: LI_VISIBILITY, hint: "Org posts are usually Public." },
            { key: "linkedinAltText", label: "Alt text", type: "text", placeholder: "Describe the image for accessibility", maxLen: 1000 },
            { key: "linkedinFirstComment", label: "First comment", type: "textarea", placeholder: "Posted as the first comment", maxLen: 1250 },
        ],
    },
    [PlatformEnum.Twitter]: {
        platform: PlatformEnum.Twitter,
        captionLabel: "Post",
        captionMaxLen: 25000,
        captionNote: "280 chars per tweet (25,000 with Premium). Longer text auto-splits into a thread.",
        fields: [
            { key: "twitterThread", label: "Thread", type: "thread", hint: "Auto-split at 280 chars without breaking words — edit the breaks below." },
            { key: "twitterReplySettings", label: "Who can reply", type: "select", options: X_REPLY },
            { key: "twitterQuoteTweetId", label: "Quote tweet ID", type: "text", placeholder: "Tweet ID to quote (optional)" },
            { key: "twitterAltText", label: "Alt text", type: "text", placeholder: "Describe the media for accessibility", maxLen: 1000 },
        ],
    },
    [PlatformEnum.YouTube]: {
        platform: PlatformEnum.YouTube,
        captionLabel: "Description",
        captionMaxLen: 5000,
        captionNote: "Requires a video attachment. First 3 hashtags surface; >15 are ignored.",
        fields: [
            { key: "youtubeTitle", label: "Title", type: "text", placeholder: "Video title", maxLen: 100, required: true },
            { key: "youtubeTags", label: "Tags", type: "tags", placeholder: "Add tags, comma separated", hint: "Up to 500 characters total." },
            { key: "youtubePrivacy", label: "Visibility", type: "select", options: YT_PRIVACY },
            { key: "youtubePlaylistId", label: "Playlist ID", type: "text", placeholder: "Add to playlist (optional)" },
            { key: "youtubeMadeForKids", label: "Made for kids", type: "toggle", hint: "Required disclosure for child-directed content." },
        ],
    },
    [PlatformEnum.Reddit]: {
        platform: PlatformEnum.Reddit,
        captionLabel: "Body",
        captionMaxLen: 40000,
        captionNote: "Reddit has no hashtags. Title (≤300) is required.",
        fields: [
            { key: "redditSubreddit", label: "Subreddit", type: "text", placeholder: "e.g. startups", required: true, hint: "Without the r/ prefix." },
            { key: "redditTitle", label: "Post title", type: "text", placeholder: "Post title", maxLen: 300, required: true },
            { key: "redditFlairId", label: "Flair ID", type: "text", placeholder: "Flair template id (optional)" },
            { key: "redditNsfw", label: "Mark NSFW", type: "toggle" },
            { key: "redditSpoiler", label: "Mark spoiler", type: "toggle" },
        ],
    },
};

/** The variation spec for a platform (caption limits + inline fields). */
export function variationSpecForPlatform(platform: Platform): PlatformVariationSpec | undefined {
    return PLATFORM_FIELD_REGISTRY[platform];
}
