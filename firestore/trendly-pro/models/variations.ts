/**
 * IContentVariation — a per-platform override of a content piece.
 *
 * Stored at: brands/{brandId}/contents/{contentId}/variations/{platform}
 *   (the document ID IS the platform key, so there can only ever be one
 *    variation per platform — see the "keyed by platform type" decision.)
 *
 * A variation is an OVERRIDE document, not a frozen snapshot. It stores only the
 * shared fields the user has explicitly edited on that platform's tab; every
 * field NOT listed in `overriddenFields` inherits LIVE from the generic parent
 * content at read/publish time. So editing the generic caption automatically
 * propagates to any variation that hasn't overridden its caption.
 *
 * Platform-specific options (YouTube title, Twitter thread, Reddit subreddit, …)
 * have no generic source, so they always live on the variation itself.
 */
import { Attachment } from "../constants/attachment";
import { Platform } from "../constants/platform";
import { IPlatformOptions } from "./contents";

/** The shared content fields, resolved for a single platform. */
export interface EffectiveContentFields {
    caption: string;
    hashtags: string;
    attachments: Attachment[];
    platformOptions?: IPlatformOptions;
}

/** Shared content fields a variation may override (inherited from generic otherwise). */
export type VariationOverridableField = "caption" | "hashtags" | "attachments";

export interface IContentVariation {
    /** The platform this variation targets. Equals the Firestore document ID. */
    platform: Platform;

    // ── Overridable copies of the generic content ────────────────────────────
    // Present ONLY when the user overrode them on this tab; otherwise the value
    // is inherited live from the generic content. Use `overriddenFields` (not key
    // presence) as the source of truth so "overridden to empty" is distinct from
    // "inherited".
    caption?: string;
    hashtags?: string;
    attachments?: Attachment[];

    /**
     * The shared fields the user has explicitly overridden on this variation.
     * Anything not listed inherits live from the generic content. Drives the
     * "Overridden / Inherited" badge and the publish-time merge.
     */
    overriddenFields: VariationOverridableField[];

    /** Platform-specific publishing extras (always variation-owned). */
    platformOptions?: IPlatformOptions;

    createdAt: number; // epoch ms
    updatedAt: number; // epoch ms
}

/** Whether `field` is currently overridden on the given variation. */
export function isFieldOverridden(
    variation: Pick<IContentVariation, "overriddenFields"> | null | undefined,
    field: VariationOverridableField
): boolean {
    return !!variation?.overriddenFields?.includes(field);
}

/**
 * Resolve the content that will actually publish to a platform by merging the
 * generic content with that platform's variation — the frontend mirror of the
 * backend `Content.EffectiveForPlatform` (content_variation.go).
 *
 * Fields the variation hasn't overridden inherit live from `generic`. Platform
 * options come wholesale from the variation when it has any (they have no
 * generic-inherit semantics), else fall back to the generic options.
 */
export function effectiveContentForPlatform(
    generic: EffectiveContentFields,
    variation:
        | Pick<
              IContentVariation,
              "caption" | "hashtags" | "attachments" | "overriddenFields" | "platformOptions"
          >
        | null
        | undefined
): EffectiveContentFields {
    if (!variation) return generic;
    const overridden = new Set(variation.overriddenFields ?? []);
    return {
        caption: overridden.has("caption") ? variation.caption ?? "" : generic.caption,
        hashtags: overridden.has("hashtags") ? variation.hashtags ?? "" : generic.hashtags,
        attachments: overridden.has("attachments")
            ? variation.attachments ?? []
            : generic.attachments,
        platformOptions: variation.platformOptions ?? generic.platformOptions,
    };
}

/** Whether a variation actually customizes anything (an override or any platform option). */
export function variationHasCustomizations(
    variation: Pick<IContentVariation, "overriddenFields" | "platformOptions"> | null | undefined
): boolean {
    if (!variation) return false;
    if ((variation.overriddenFields?.length ?? 0) > 0) return true;
    return Object.values(variation.platformOptions ?? {}).some(
        (v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
    );
}
