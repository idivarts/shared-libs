import { ICollection } from "../../collections";
import { Attachment } from "../constants/attachment";
import { ExternalLink } from "../constants/external-link";
import { PromotionType } from "../constants/promotion-type";


export enum PromotionSubject {
    PhysicalProduct = "physical_product",  // Product/service shipped
    Services = "services",                  // Professional services
    Others = "others",                      // Other promotions (food, store, etc.)
}

export interface IPromotionSubjectItem {
    name: string;   // e.g. "Instagram Reel", "Store Visit"
    cost: number;   // cost per subject
}

export interface ICollaboration {
    name: string;
    brandId: string;
    managerId: string;

    attachments?: Attachment[];
    description?: string;

    promotionType: PromotionType;
    promotionSubject: PromotionSubject;
    subjects: IPromotionSubjectItem[];

    budget?: {
        min?: number;
        max?: number;
    };

    preferredContentLanguage: string[];
    contentFormat: string[];
    platform: string[];
    numberOfInfluencersNeeded: number;

    /** 🔁 UPDATED location */
    location: {
        type:
            | "on_site"          // Influencer visits store
            | "remote"           // Digital / Remote
            | "physical_mode";   // Product shipped to influencer
        name?: string;
        latlong?: {
            lat: number;
            long: number;
        };
    };

    externalLinks?: ExternalLink[];
    questionsToInfluencers?: string[];
    preferences: IAdvanceFilters;

    status: "active" | "past" | "draft" | "published";

    applications: ICollection<IApplications>;
    invitations: ICollection<IInvitations>;

    timeStamp: number;
    viewsLastHour?: number;
    lastReviewedTimeStamp?: number | null;
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

    // Quality/aesthetics slider (0..100) (int)
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