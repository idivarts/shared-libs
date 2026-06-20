import { ICollection } from "../../collections";
import { PromotionType } from "../constants/promotion-type";
import { IAdvanceFilters } from "./collaborations";
import { IComment } from "./comments";
import { IPublicShareRef } from "./share-links";

export enum StrategyStatus {
    Draft = "draft",           // Strategy is being planned, not yet active
    Active = "active",         // Strategy is currently being executed
    // Pushed to the content calendar and locked. The document and the AI chat
    // become read-only; to iterate further the strategy must be duplicated.
    // Set by the backend when "Push to Calendar" completes successfully.
    Finalized = "finalized",
    Completed = "completed",   // Strategy has been completed
    Archived = "archived",     // Strategy is no longer relevant
}

export interface IStrategy {
    name: string; // Display name of the strategy (e.g., "Q3 2026 Diwali Campaign")
    managerId: string; // Manager who owns and created this strategy

    description?: string; // High-level overview of the strategy's intent
    objective?: string; // Primary marketing goal (e.g., "brand awareness", "sales", "engagement")

    status: StrategyStatus;

    // Epoch timestamps for the campaign window this strategy covers
    timeline?: {
        startDate: number;
        endDate: number;
    };

    // Platforms this strategy targets (e.g. Instagram, YouTube)
    platforms?: string[];

    // Content formats planned under this strategy (e.g. Reel, Story, Post)
    contentFormats?: string[];

    promotionType?: PromotionType; // Paid or Barter — the main deal structure for this strategy

    budget?: {
        total?: number;          // Total budget allocated for this strategy (in INR)
        perInfluencer?: number;  // Maximum per-influencer spend
    };

    // Target influencer profile for this strategy — reuses the discovery filter shape
    targetAudience?: IAdvanceFilters;

    numberOfInfluencers?: number; // How many influencers this strategy aims to work with

    // AI-generated or manually written markdown strategy document.
    // This is the full rich-text body shown in the strategy editor panel.
    //
    // NOTE (real-time collaboration, Phase 2): once a strategy is co-edited on
    // web, the Yjs CRDT (stored under the `yupdates` subcollection) becomes the
    // source of truth for the live document, and `markdownContent` is a *derived
    // cache* — refreshed from the converged CRDT state so native, AI, export and
    // search keep reading a plain HTML field. Native (single-writer) still writes
    // it directly.
    markdownContent?: string;

    // ── Real-time collaboration (Phase 2 — Yjs CRDT) ───────────────────────
    /**
     * One-time guard: set to true (transactionally) the first time a Yjs doc is
     * bootstrapped for this strategy from `markdownContent`. Prevents two clients
     * seeding the CRDT simultaneously and duplicating the document body.
     */
    crdtInitialized?: boolean;

    /**
     * Monotonic counter bumped whenever the backend (AI action) or a native
     * editor rewrites `markdownContent` wholesale and resets the CRDT. Every
     * yupdate is tagged with the generation it was written under; clients
     * ignore yupdates whose generation doesn't match the strategy's current
     * `crdtGeneration`. This eliminates the race between the doc Update that
     * sets `crdtInitialized: false` and the (async) deletion of stale
     * yupdates — the re-bootstrapped editor simply ignores any leftover
     * old-gen updates instead of waiting for them to be pruned.
     */
    crdtGeneration?: number;

    /**
     * Soft single-writer lock arbitrating the native ↔ web boundary (Phase 3).
     * While held, the other surface mounts read-only. `heartbeatAt` lets a stale
     * lock (crashed/closed editor) expire so the doc never gets stuck locked.
     */
    editLock?: {
        managerId: string;
        name: string;
        heartbeatAt: number; // epoch ms — refreshed while the holder is active
    } | null;

    // IDs of collaborations that execute on this strategy — populated as collabs are created
    collaborationIds?: string[];

    // IDs of content pieces created under this strategy
    contents?: ICollection<IStrategyContent>;

    // ── Collaboration ──────────────────────────────────────────────────────
    /**
     * Manager IDs (in addition to `managerId`) who have been granted co-edit
     * access to this strategy. Added via the ShareModal in the UI.
     */
    collaboratorIds?: string[];

    /**
     * Tracks who last edited the document body (markdown) and when.
     * Updated on every `updateStrategyContent` call alongside `updatedAt`.
     */
    lastEditedBy?: string;  // Manager ID
    lastEditedAt?: number;  // Epoch timestamp

    // ── Review / Approval flow ─────────────────────────────────────────────
    /**
     * Current review state of this strategy document.
     *
     * - "draft"             (default) — being authored, not yet sent for review
     * - "in_review"         — sent for review, awaiting a decision from collaborators
     * - "approved"          — at least one collaborator has approved it
     * - "changes_requested" — a reviewer has requested changes; author must revise
     */
    reviewStatus?: "draft" | "in_review" | "approved" | "changes_requested";

    /** Manager ID who sent the strategy for review */
    reviewRequestedBy?: string;

    /** Epoch timestamp when the review was requested */
    reviewRequestedAt?: number;

    /** Manager ID who made the final approve/reject decision */
    reviewedBy?: string;

    /** Epoch timestamp of the approve/reject decision */
    reviewedAt?: number;

    createdAt: number; // Epoch timestamp of when this strategy was created
    updatedAt: number; // Epoch timestamp of the last edit — update on every write

    // ── Public sharing ─────────────────────────────────────────────────────
    /**
     * Set when this strategy is published as a public, view-only share link.
     * When `publicShare.enabled` is true, Firestore rules permit anonymous
     * reads of this document (and its comments, for logged-in non-members).
     * `token` maps back to the `shareLinks/{token}` doc.
     */
    publicShare?: IPublicShareRef;

    comments?: ICollection<IComment>; // Comments on the strategy document (for feedback and discussion)
}

// Lightweight reference stored as a subcollection on the strategy to track linked content
export interface IStrategyContent {
    contentId: string; // ID of the content document in the brand's contents subcollection
    addedAt: number;   // Epoch timestamp of when this content was linked to the strategy
}
