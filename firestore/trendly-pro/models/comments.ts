/**
 * IComment — unified comment model used across three surfaces:
 *
 *  1. Strategy document-level comments
 *     Stored at: brands/{brandId}/strategies/{strategyId}/comments/{commentId}
 *
 *  2. Strategy snippet comments (inline text annotations)
 *     Same collection, distinguished by the presence of `snippet` / `anchorStart` / `anchorEnd`.
 *
 *  3. Content / Calendar item comments
 *     Stored at: brands/{brandId}/contents/{contentId}/comments/{commentId}
 *     Comments written from the Calendar and from the Content detail page share this
 *     subcollection — no duplication, no sync needed.
 *
 *  4. Calendar month-level comments
 *     Stored at: brands/{brandId}/calendarComments/{YYYY-MM}/comments/{commentId}
 *     Distinguished by `calendarMonth` being set.
 */
export interface IComment {
    /** ID of the manager who authored this comment */
    authorId: string;

    /**
     * Display name of the author at the time of writing.
     * Denormalised here so comment threads render without extra lookups.
     */
    authorName: string;

    /** The comment body text */
    text: string;

    // ── Strategy snippet anchoring (optional) ──────────────────────────────
    /**
     * The exact text the user had selected in the strategy markdown editor
     * when they opened the comment popover. Stored so the highlight can be
     * recreated when the document is reopened.
     */
    snippet?: string;

    /**
     * Character offset in `markdownContent` where the selection starts.
     * Used to re-anchor the highlight if the document is re-rendered.
     */
    anchorStart?: number;

    /** Character offset where the selection ends (exclusive). */
    anchorEnd?: number;

    // ── Calendar month-level comments (optional) ───────────────────────────
    /**
     * Set to "YYYY-MM" (e.g. "2026-06") when this comment belongs to an
     * entire calendar month rather than a specific content item.
     * Only populated on documents in the `calendarComments` subcollection.
     */
    calendarMonth?: string;

    // ── Threading ──────────────────────────────────────────────────────────
    /**
     * ID of the parent comment if this is a reply.
     * Top-level comments leave this undefined.
     */
    parentId?: string;

    /**
     * Whether the author (or any collaborator) has marked this thread as
     * resolved. Resolved threads are hidden by default but can be surfaced
     * via a "Show resolved" toggle.
     */
    resolved?: boolean;

    /** Epoch timestamp of when this comment was created */
    createdAt: number;

    /** Epoch timestamp updated on every edit to the comment body */
    updatedAt: number;
}
