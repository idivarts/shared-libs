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
