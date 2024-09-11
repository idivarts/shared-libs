import { ICollection } from "../../collections";
import { CollaborationType } from "../constants/collaboration-type";
import { PromotionType } from "../constants/promotion-type";
import { SocialPlatform } from "../constants/social-platform";

export interface ICollaboration {
    name: string; // Name of the collaboration
    brandId: string; // Brand details
    managerId: string; // Manager who created the collaboration

    description?: string; // Description of the ad campaigns and objectives
    timeStamp: number; // Posted date and time
    budget: { // Associated price or cost
        min?: number;
        max?: number;
    };
    location: { // Location of the collaboration (e.g., city, country)
        type: string; // Type of location (e.g., physical, remote)
        name?: string; // Location name - applicable for physical locations
        latlong?: any; // Latitude and longitude - applicable for physical locations
    };

    promotionType: PromotionType; // Type of promotion (e.g., paid, barter)
    collaborationType: CollaborationType; // Type of collaboration (e.g., long-term, short-term)
    platform: SocialPlatform; // Platform for the campaign (e.g., Instagram, YouTube)

    numberOfInfluencersNeeded: number; // Number of influencers they are looking for
    externalLinks?: string[]; // Array to hold any number of external links
    viewsLastHour?: number; // Number of influencers who viewed this in the last 1 hour
    lastReviewedTimeStamp?: number | null; // Last time the brand reviewed the influencers

    applications: ICollection<IApplications>; // Proposals for the collaboration
    invitaions: ICollection<IInvitations>; // Invitations for the collaboration

    // These data needs to come from api calls
    // aiGeneratedSuccessRate: number; // AI-generated success rate for influencer selection (e.g., percentage)
    // aiGeneratedResponseTime: string; // AI-generated estimate of how soon to expect the brand to respond (e.g., "2-3 days")
}

export interface IApplications {
    userId: string;
    collaborationId: string;
    status: string;
    timeStamp: number;
    message: string;
}

export interface IInvitations {
    userId: string;
    collaborationId: string;
    managerId: string;
    status: string;
    timeStamp: number;
    message: string;
}

