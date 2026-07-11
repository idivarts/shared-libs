/**
 * IDesignSystem — a brand's single, declared design/brand standard.
 *
 * Stored at: brands/{brandId}/designSystem/main
 *   (the document ID is fixed to "main", which is what enforces ONE Design
 *    System per brand — there is no way to create a second.)
 *
 * This is the frontend mirror of the backend `trendlymodels.BrandDesignSystem`
 * (brand_design_system.go). Keep the two in sync. The whole document is fed into
 * every AI conversation for the brand — its voice supersedes the legacy
 * `Brand.aiVoice`, its identity/rules/imagery ride the system prompt, and its
 * colors/fonts/logo become the brand-kit CSS the design tools use — so that
 * everything the AI produces (captions, scripts, images, reels, designs) follows
 * one consistent standard.
 *
 * Every section is optional; the user fills the Design System progressively and
 * only the populated parts reach the AI.
 */
import { Platform } from "../constants/platform";

/** Fixed document id — one Design System per brand. */
export const DESIGN_SYSTEM_DOC_ID = "main";

export type DSColorRole =
    | "primary"
    | "secondary"
    | "accent"
    | "neutral"
    | "background"
    | "text";

export const DS_COLOR_ROLES: DSColorRole[] = [
    "primary",
    "secondary",
    "accent",
    "neutral",
    "background",
    "text",
];

export type DSFontRole = "heading" | "subheading" | "body" | "caption" | "quote";

export const DS_FONT_ROLES: DSFontRole[] = [
    "heading",
    "subheading",
    "body",
    "caption",
    "quote",
];

export type DSFontSource = "google" | "adobe" | "custom";

export type DSLogoVariant = "primary" | "stacked" | "icon" | "white" | "mono";

export const DS_LOGO_VARIANTS: DSLogoVariant[] = [
    "primary",
    "stacked",
    "icon",
    "white",
    "mono",
];

export type DSImageStyleType = "photo" | "illustration" | "3d" | "mixed";

export type DSPointOfView = "we" | "you" | "brand";

export type DSEmojiPolicy = "none" | "minimal" | "liberal";

export type DSCaptionLength = "short" | "medium" | "long";

export interface IDSIdentity {
    tagline?: string;
    mission?: string;
    audience?: string;
    personality?: string[];
    valueProps?: string[];
    competitors?: string[];
}

export interface IDSColor {
    name?: string;
    role?: DSColorRole;
    hex?: string;
    usageNote?: string;
}

export interface IDSFont {
    role?: DSFontRole;
    family?: string;
    weight?: string;
    source?: DSFontSource;
    url?: string;
    fallback?: string;
}

export interface IDSLogo {
    variant?: DSLogoVariant;
    url?: string;
    clearSpaceNote?: string;
}

export interface IDSAsset {
    type?: string;
    url?: string;
    name?: string;
}

export interface IDSImagery {
    moodKeywords?: string[];
    colorTreatment?: string;
    composition?: string;
    subjectMatter?: string;
    styleType?: DSImageStyleType;
    avoid?: string[];
    referenceImages?: string[];
}

/** 0..100 tone dials (50 = neutral). Undefined = not set (treated as neutral). */
export interface IDSToneSliders {
    formality?: number; // 0 casual … 100 formal
    playfulness?: number; // 0 serious … 100 playful
    warmth?: number; // 0 neutral … 100 warm
    boldness?: number; // 0 understated … 100 bold
    luxury?: number; // 0 accessible … 100 premium
}

/** The tone dials rendered in the editor, with their two poles. */
export const DS_TONE_DIALS: {
    key: keyof IDSToneSliders;
    low: string;
    high: string;
}[] = [
    { key: "formality", low: "Casual", high: "Formal" },
    { key: "playfulness", low: "Serious", high: "Playful" },
    { key: "warmth", low: "Neutral", high: "Warm" },
    { key: "boldness", low: "Understated", high: "Bold" },
    { key: "luxury", low: "Accessible", high: "Premium" },
];

export interface IDSVoice {
    adjectives?: string[];
    tone?: IDSToneSliders;
    pov?: DSPointOfView;
    emojiPolicy?: DSEmojiPolicy;
    readingLevel?: string;
    samplePhrases?: string[];
    guidelines?: string;
}

export interface IDSHashtagRules {
    branded?: string[];
    banned?: string[];
    maxCount?: number;
}

export interface IDSContentRules {
    preferredTerms?: string[];
    bannedWords?: string[];
    approvedClaims?: string[];
    disclaimers?: string[];
    requiredMentions?: string[];
    hashtag?: IDSHashtagRules;
    ctaStyle?: string;
    grammar?: string;
    dos?: string[];
    donts?: string[];
}

export interface IDSPlatformOverride {
    toneOverride?: string;
    captionLength?: DSCaptionLength;
    hashtagStrategy?: string;
    contentPillars?: string[];
    notes?: string;
}

export interface IDesignSystem {
    identity?: IDSIdentity;
    palette?: IDSColor[];
    fonts?: IDSFont[];
    logos?: IDSLogo[];
    assets?: IDSAsset[];
    logoGuidelines?: string;
    imagery?: IDSImagery;
    voice?: IDSVoice;
    rules?: IDSContentRules;
    /** Per-platform overrides, keyed by {@link Platform}. */
    platformOverrides?: Partial<Record<Platform, IDSPlatformOverride>>;

    updatedAt?: number; // epoch ms
    updatedBy?: string; // manager id
}

/** The Design System's editable sections, in the order the editor lists them. */
export const DS_SECTIONS = [
    "identity",
    "colors",
    "typography",
    "logo",
    "imagery",
    "voice",
    "rules",
    "platforms",
] as const;

export type DSSectionKey = (typeof DS_SECTIONS)[number];

/**
 * Whether a section has any meaningful content. Drives the completeness meter
 * and the "done" ticks in the section navigator — a section with only empty
 * strings / empty arrays counts as incomplete.
 */
export function isDSSectionFilled(ds: IDesignSystem | null | undefined, section: DSSectionKey): boolean {
    if (!ds) return false;
    const nonEmptyStr = (s?: string) => !!s && s.trim().length > 0;
    const nonEmptyArr = (a?: unknown[]) => !!a && a.length > 0;

    switch (section) {
        case "identity": {
            const id = ds.identity;
            return (
                !!id &&
                (nonEmptyStr(id.tagline) ||
                    nonEmptyStr(id.mission) ||
                    nonEmptyStr(id.audience) ||
                    nonEmptyArr(id.personality) ||
                    nonEmptyArr(id.valueProps) ||
                    nonEmptyArr(id.competitors))
            );
        }
        case "colors":
            return (ds.palette ?? []).some((c) => nonEmptyStr(c.hex));
        case "typography":
            return (ds.fonts ?? []).some((f) => nonEmptyStr(f.family));
        case "logo":
            return (ds.logos ?? []).some((l) => nonEmptyStr(l.url)) || nonEmptyArr(ds.assets);
        case "imagery": {
            const img = ds.imagery;
            return (
                !!img &&
                (nonEmptyArr(img.moodKeywords) ||
                    nonEmptyStr(img.colorTreatment) ||
                    nonEmptyStr(img.composition) ||
                    nonEmptyStr(img.subjectMatter) ||
                    nonEmptyStr(img.styleType) ||
                    nonEmptyArr(img.avoid))
            );
        }
        case "voice": {
            const v = ds.voice;
            return (
                !!v &&
                (nonEmptyArr(v.adjectives) ||
                    nonEmptyStr(v.guidelines) ||
                    nonEmptyStr(v.pov) ||
                    nonEmptyStr(v.emojiPolicy) ||
                    nonEmptyArr(v.samplePhrases) ||
                    (!!v.tone && Object.values(v.tone).some((n) => typeof n === "number")))
            );
        }
        case "rules": {
            const r = ds.rules;
            if (!r) return false;
            return (
                nonEmptyArr(r.preferredTerms) ||
                nonEmptyArr(r.bannedWords) ||
                nonEmptyArr(r.approvedClaims) ||
                nonEmptyArr(r.disclaimers) ||
                nonEmptyArr(r.requiredMentions) ||
                nonEmptyStr(r.ctaStyle) ||
                nonEmptyStr(r.grammar) ||
                nonEmptyArr(r.dos) ||
                nonEmptyArr(r.donts) ||
                (!!r.hashtag &&
                    (nonEmptyArr(r.hashtag.branded) ||
                        nonEmptyArr(r.hashtag.banned) ||
                        typeof r.hashtag.maxCount === "number"))
            );
        }
        case "platforms":
            return Object.values(ds.platformOverrides ?? {}).some((ov) => {
                if (!ov) return false;
                return (
                    nonEmptyStr(ov.toneOverride) ||
                    nonEmptyStr(ov.captionLength) ||
                    nonEmptyStr(ov.hashtagStrategy) ||
                    nonEmptyArr(ov.contentPillars) ||
                    nonEmptyStr(ov.notes)
                );
            });
        default:
            return false;
    }
}

/** 0..100 completeness across all sections — drives the meter. */
export function designSystemCompleteness(ds: IDesignSystem | null | undefined): number {
    if (!ds) return 0;
    const filled = DS_SECTIONS.filter((s) => isDSSectionFilled(ds, s)).length;
    return Math.round((filled / DS_SECTIONS.length) * 100);
}
