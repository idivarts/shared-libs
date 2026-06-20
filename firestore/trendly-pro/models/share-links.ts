/**
 * Public share links — makes a Strategy doc, a Content Calendar month, or a
 * single Content item viewable via an unguessable token URL.
 *
 *   https://brands.trendly.now/share/{token}
 *
 * Stored at the top-level collection `shareLinks/{token}`. The token is the
 * document id (an unguessable random string), so resolving a link is a single
 * doc read with no query/index.
 *
 * Access tiers (resolved on the client from the shared Firebase session):
 *   1. Anonymous            → read-only, no comments.
 *   2. Logged-in non-member → read-only + comments visible & postable.
 *   3. Brand member         → routed into the authenticated editor.
 *
 * Strategy & Content additionally carry a lightweight `IPublicShareRef` on the
 * resource document itself (see `publicShare` on IStrategy / IContent) so the
 * Firestore read rule is a cheap field check on the realtime path rather than a
 * cross-document lookup. The calendar month has no single doc, so it is served
 * by an unauthenticated backend endpoint instead.
 */

export type ShareType = "strategy" | "calendarMonth" | "content";

export interface IShareLink {
    /** What this link points at. */
    type: ShareType;

    /** Brand that owns the shared resource. */
    brandId: string;

    /**
     * Strategy id or content id. Omitted for `calendarMonth` (use `month`).
     */
    resourceId?: string;

    /** "YYYY-MM" — only set when `type === "calendarMonth"`. */
    month?: string;

    /** When false the link is revoked: public pages must 404. */
    enabled: boolean;

    /** Manager id who created the link. */
    createdBy: string;

    createdAt: number; // epoch ms
    updatedAt: number; // epoch ms
}

/**
 * Embedded on the shared resource document (strategy / content) so Firestore
 * rules can gate public reads with a single field check.
 */
export interface IPublicShareRef {
    enabled: boolean;
    /** The `shareLinks/{token}` id this resource is shared under. */
    token: string;
}
