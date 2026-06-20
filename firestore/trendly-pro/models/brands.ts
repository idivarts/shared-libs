import { ICollection } from "../../collections";
import { IAdvanceFilters } from "./collaborations";
import { IContent } from "./contents";
import { INotifications } from "./notifications";
import { IStrategy } from "./strategies";

export enum CRMStatus {
    NEW_LEADS = "new_leads",
    IN_PROGRESS_LEADS = "in_progress_leads",
    ACTIVE_LEADS = "active_leads",
    CHURNED_LEADS = "churned_leads",
}

export interface IBrands {
    name: string; // Name of the brand
    age?: string;
    // ISO-3166 alpha-2 country code (e.g. "IN", "US") captured silently at
    // onboarding. Source of truth for India-only gating. Never shown in the UI.
    // Missing => treat as India (see isIndiaCountry()).
    country?: string;
    image?: string; // Image of the brand
    paymentMethodVerified?: boolean; // Indicates if the payment method is verified
    paymentLinks?: string[]
    creationTime: number,
    growthBook?: any,
    hasPayWall?: boolean,
    // false for a draft brand created at the start of AI onboarding; flipped to
    // true once onboarding finishes and the brand is provisioned. Draft brands
    // are hidden from brand lists and skip the paywall until this is true.
    onboardingComplete?: boolean,

    // Parent organization this brand belongs to (billing/plan live on the org).
    // Absent on brands created before the Organization rollout until backfilled.
    organizationId?: string,
    // Soft-delete marker (epoch ms). Non-null => brand is deleted/archived.
    deletedAt?: number,

    unlockedInfluencers?: string[],
    discoveredInfluencers?: string[],
    connectedInfluencers?: {
        requested?: string[],
        connected?: string[]
    }

    profile?: {
        about?: string; // About of the brand
        banner?: string; // Banner of the brand
        industries?: string[]; // Industries of the brand
        website?: string; // Website of the brand
        phone?: string
    };

    preferences?: {
        promotionType?: string[]; // Promotion types (e.g., Barter, Paid)
        influencerCategories?: string[]; // Influencer Category (Beauty, Fashion, etc.)
        languages?: string[],
        locations?: string[],
        platforms?: string[],
        collaborationPostTypes?: string[],
        timeCommitments?: string[],
        contentVideoType?: string[]
    };

    discoverPreferences?: IAdvanceFilters;

    backend?: {
        // These would be updated only from backend
        hireRate?: number; // Brand hire rate (e.g., percentage)
    };

    crmStatus?: CRMStatus; // CRM status for lead management

    survey?: {
        // This contains some survey about the trendly app
        source?: string; // Source from where you have heaed about us
        purpose?: string; // Purpose of using Trendly
        collaborationValue?: string; // Collaboration value
    };

    // AI-maintained, per-brand long-term memory: durable brand facts the AI
    // captures from chat (via the update_brand_memory tool) and pre-feeds into
    // every AI conversation so the user never re-explains context. Editable by
    // the user on the brand-profile page. Scoped strictly to this brand — never
    // shared across brands or organizations. Kept under a char cap (compacted by
    // the backend when it grows too large).
    aiMemory?: string;
    aiMemoryUpdatedAt?: number; // epoch ms of the last memory write

    members?: ICollection<IBrandsMembers>; // Members of the brand
    notifications?: ICollection<INotifications>; // Notifications for the brand

    // Subcollections for content planning — stored under brands/{brandId}/strategies
    strategies?: ICollection<IStrategy>;

    // Subcollections for individual content pieces — stored under brands/{brandId}/contents
    // postingTimeStamp on each IContent drives calendar placement (no separate calendar model)
    contents?: ICollection<IContent>;

    calendarComments?: ICollection<IContent>;
}

export interface IBrandsMembers {
    brandId: string;
    managerId: string;
    status: number;

    designation?: string; // Designation of the member

    permissions?: {
        read?: boolean;
        write?: boolean;
        admin?: boolean;
    };
}
