import { ICollection } from "../../collections";
import { Attachment } from "../constants/attachment";
import { ExternalLink } from "../constants/external-link";
import { PromotionType } from "../constants/promotion-type";

/** Stored string values for `collaboration.location.type` (single source of truth). */
export enum CollaborationLocationType {
    PhysicalMode = "physical-mode",
    Remote = "remote",
    OnSite = "on-site",
}

/** Normalize Firestore / legacy values to {@link CollaborationLocationType}. */
export function normalizeCollaborationLocationType(
    raw: string | undefined | null
): CollaborationLocationType {
    if (!raw) return CollaborationLocationType.Remote;
    if (raw === "On_Site") return CollaborationLocationType.OnSite;
    if (raw === "Remote") return CollaborationLocationType.Remote;
    if (
        raw === CollaborationLocationType.PhysicalMode ||
        raw === CollaborationLocationType.Remote ||
        raw === CollaborationLocationType.OnSite
    ) {
        return raw;
    }
    return CollaborationLocationType.Remote;
}

/** Short label for chips and overview (not the raw enum string). */
export function getCollaborationLocationDisplayLabel(
    type?: string | null
): string {
    const t = normalizeCollaborationLocationType(type);
    switch (t) {
        case CollaborationLocationType.PhysicalMode:
            return "Physical shipment";
        case CollaborationLocationType.Remote:
            return "Remote";
        case CollaborationLocationType.OnSite:
            return "On-site";
        default:
            return CollaborationLocationType.Remote;
    }
}

export interface ICollaboration {
    name: string; // Name of the collaboration
    brandId: string; // Brand details
    managerId: string; // Manager who created the collaboration

    attachments?: Attachment[];
    description?: string; // Description of the ad campaigns and objectives

    promotionType: PromotionType; // Type of promotion (e.g., paid, barter)
    budget?: {
        // Applicable for paid promotions
        min?: number;
        max?: number;
    };
    preferredContentLanguage: string[]; // E.g. English, Hindi, Bengali, Marathi
    contentFormat: string[]; // E.g. Posts, Stories, Reels, Live, Product Reviews
    platform: string[]; // E.g. Facebook, Instagram, Twitter
    numberOfInfluencersNeeded: number;
    promotionSubject?: "physical-product" | "services" | "others"; // What the brand is promoting
    products?: {
        name?: string; // Product/service name
        cost?: number; // Product cost (optional)
    }[];

    location?: {
        type?: CollaborationLocationType; // Fulfilment / location type (remote, on-site, physical shipment)
        name?: string;
        latlong?: {
            lat: number;
            long: number;
        };
    };

    externalLinks?: ExternalLink[];
    questionsToInfluencers?: string[];
    maxRevisions?: number;
    preferences: IAdvanceFilters;
    status: string; // "active", "past", "draft", "published"

    applications: ICollection<IApplications>; // Proposals for the collaboration
    invitations: ICollection<IInvitations>; // Invitations for the collaboration

    timeStamp: number; // Posted date and time
    viewsLastHour?: number; // Number of influencers who viewed this in the last 1 hour
    lastReviewedTimeStamp?: number | null; // Last time the brand reviewed the influencers
    // These data needs to come from api calls
    // aiGeneratedSuccessRate: number; // AI-generated success rate for influencer selection (e.g., percentage)
    // aiGeneratedResponseTime: string; // AI-generated estimate of how soon to expect the brand to respond (e.g., "2-3 days")
}

export interface IAdvanceFilters {
    // Followers range (int64)
    followerMin?: number,
    followerMax?: number,

    // Content/posts count range (int)
    contentMin?: number,
    contentMax?: number,

    // Estimated monthly views range (int64)
    monthlyViewMin?: number,
    monthlyViewMax?: number,

    // Estimated monthly engagements range (int64)
    monthlyEngagementMin?: number,
    monthlyEngagementMax?: number,

    // Median/average metrics ranges (int64)
    avgViewsMin?: number,
    avgViewsMax?: number,
    avgLikesMin?: number,
    avgLikesMax?: number,
    avgCommentsMin?: number,
    avgCommentsMax?: number,

    // Quality/aesthetics (0..10, displayed as 0-5 stars)
    qualityMin?: number,
    qualityMax?: number,

    // Engagement rate as percent number (float64)
    erMin?: number, // e.g., "1.5" -> 1.5
    erMax?: number,

    // Text filters
    descKeywords?: string[],
    name?: string,

    // Flags
    isVerified?: boolean,
    hasContact?: boolean,

    // Multi-selects
    genders?: string[],
    selectedNiches?: string[],
    selectedLocations?: string[],

    // Sort preference (e.g. "followers" | "engagement" | "views" | "engagement_rate")
    sort?: string,
}

// Empty Illustration (there are none in that category)
// Looking for past applications/invitations (but if there are past data available)

// total - 0 -> empty
// total - 5, active -> 0 -> Looking for past application (Illustration)
// total - 10, active -> 5, inactive -> 5 -> Data to seen | At the bottom looking for past?
// total - 10, active -> 10, inactive -> 0 -> Data

export interface IApplications {
    userId: string;
    collaborationId: string;
    status: "pending" | "shortlisted" | "rejected" | "accepted"; // "active", "rejected", "accepted"
    timeStamp: number;
    message: string;
    quotation: number;
    answersFromInfluencer: {
        question: number;
        answer: string;
    }[];
    attachments: Attachment[];
}

export interface IInvitations {
    userId: string;
    isDiscover?: boolean;

    collaborationId: string;
    managerId: string;
    status: string; // "active", "inactive", "accepted"
    timeStamp: number;
    message: string;
}
