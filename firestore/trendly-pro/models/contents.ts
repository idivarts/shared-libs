import { ICollection } from "../../collections";
import { Attachment } from "../constants/attachment";
import { ContentFormat } from "../constants/content-format";
import { ExternalLink } from "../constants/external-link";
import { Platform } from "../constants/platform";
import { IComment } from "./comments";
import { IPublicShareRef } from "./share-links";

export enum ContentStatus {
    Draft = "draft",                     // Content is being drafted by the manager/influencer
    InProgress = "in_progress",          // Actively being worked on (between Draft and review)
    PendingReview = "review_pending",    // Submitted for brand review before scheduling
    Approved = "approved",               // Brand approved — ready to be scheduled or posted
    Scheduled = "scheduled",             // postingTimeStamp is set; will go live at that time
    Posted = "posted",                   // Content has been published on the platform
    Rejected = "rejected",               // Brand rejected this revision — needs rework
}

export interface IContent {
    title: string;     // Short label for the content piece (e.g., "Diwali unboxing reel")
    managerId: string; // Manager who created or owns this content record

    // Optionally linked to an influencer who is creating/delivering this content
    userId?: string;

    // Optionally linked to a contract deliverable — when content originates from a collab
    contractId?: string;
    collaborationId?: string;

    // Optionally linked to a strategy this content is part of
    strategyId?: string;

    // Platforms this content is planned for (the publishing INTENT). Chosen at
    // creation; `destinations` below are the concrete connected accounts picked
    // at publish time and must each target one of these platforms.
    platforms: Platform[];

    /**
     * @deprecated Legacy single-platform field (capitalised string, e.g.
     * "Instagram"). Superseded by `platforms`. Still read for backward-compat
     * coercion of old documents — never written by new code.
     */
    platform?: string;

    contentFormat: ContentFormat; // One format per content piece (see ContentFormatEnum)

    status: ContentStatus;

    description?: string; // Brief creative brief or description for this piece

    // Epoch timestamp — this is the single source of truth for calendar placement.
    // When set, the content appears on the calendar at this date/time.
    // Null/undefined means the content is unscheduled (not yet on the calendar).
    postingTimeStamp?: number;

    attachments?: Attachment[]; // Media files: reference images, drafts, final videos

    // Live state of an AI image-generation job, written by the backend websocket
    // handler. Lets the app render progress + the finished image from its
    // Firestore subscription, independent of the websocket that started the job.
    imageGeneration?: IImageGeneration;

    // Dedicated AI thread (ai_conversations doc, module="media") for this
    // content's image generate/enhance iterations. Stamped by the backend on the
    // first generation; enables context-aware "Enhance" on subsequent prompts.
    mediaConversationId?: string;

    // External links relevant to this content (moodboard, brief docs, competitor examples)
    externalLinks?: ExternalLink[];

    notes?: string; // Manager notes or creative direction for the influencer

    // Social copy fields — filled out once the content is being produced
    caption?: string;      // Social media caption text for the post
    hashtags?: string;     // Hashtag string (e.g. "#IndianBrand #D2C #Reel")
    timeOfPosting?: string; // Time of day for posting precision, "HH:MM" 24-hour format
    script?: string;       // Full script or copy for video/reel content
    imagePrompt?: string;  // AI image generation prompt for visual content planning

    // History of revision requests — appended each time a rejection is issued
    revisionNotes?: string[];

    // Connected social accounts this content will be published / scheduled to.
    destinations?: ContentDestination[];

    // Publish immediately ("now") or at `scheduledAt` ("scheduled").
    scheduleMode?: "now" | "scheduled";

    // Epoch ms when a scheduled post should go live (precise publish time —
    // distinct from `postingTimeStamp`, which is the date used for calendar placement).
    scheduledAt?: number;

    // Step Functions execution ARN for the scheduled-publish job (from delayed_sqs).
    // Stored so the schedule can be cancelled / rescheduled via StopExecutions.
    scheduleExecutionArn?: string;

    // Per-platform published post IDs, keyed by platform (e.g. { instagram: "...", facebook: "..." }).
    publishedIds?: Record<string, string>;

    // Failure reason set by the publish consumer when status transitions to a failed publish.
    publishError?: string;

    // URL of the live post once status reaches Posted
    postedUrl?: string;

    // Whether this content piece has been manually archived by the brand
    isArchived: boolean;

    /**
     * Cached count of comments on this content item.
     * Incremented client-side when a comment is added so calendar item badges
     * can display the count without querying the comments subcollection.
     */
    commentCount?: number;

    // Performance metrics captured after the content goes live
    metrics?: ContentMetrics;

    createdAt: number; // Epoch timestamp of initial record creation
    updatedAt: number; // Epoch timestamp updated on every write to this document

    // ── Public sharing ─────────────────────────────────────────────────────
    /**
     * Set when this content piece is published as a public, view-only share
     * link. When `publicShare.enabled` is true, Firestore rules permit
     * anonymous reads of this document (and its comments, for logged-in
     * non-members). `token` maps back to the `shareLinks/{token}` doc.
     */
    publicShare?: IPublicShareRef;

    comments?: ICollection<IComment>; // Comments on the content piece (for feedback and discussion)
}

/** A connected social account a content piece is published / scheduled to. */
export interface ContentDestination {
    socialAccountId: string;
    platform: Platform;
    username?: string;
}

/** Live state of a backend-driven AI image-generation job for a content piece. */
export interface IImageGeneration {
    status: "generating" | "done" | "error";
    prompt?: string;
    error?: string;
    requestedCount?: number;
    completedCount?: number;
    startedAt?: number; // epoch ms
    updatedAt?: number; // epoch ms
}

export interface ContentMetrics {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
    reach?: number;
    saves?: number; // Saves/bookmarks — particularly relevant for Instagram content
    engagementRate?: number; // Computed: (likes + comments + saves) / reach * 100
}
