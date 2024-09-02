import { ICollection } from "../../collections";

export interface ICollaboration {
    name: string; // Name of the collaboration
    brandId: string; // Brand details
    description: string; // Description of the ad campaigns and objectives
    timeStamp: number; // Posted date and time
    budget: { // Associated price or cost
        min: number;
        max: number;
    };
    location: { // Location of the collaboration (e.g., city, country)
        type: string; // Type of location (e.g., physical, remote)
        name?: string; // Location name - applicable for physical locations
        latlong?: any; // Latitude and longitude - applicable for physical locations
    };
    promotionType: string; // Type of promotion (e.g., paid, barter)
    collaborationType: string; // Type of collaboration (e.g., long-term, short-term)
    platform: string; // Platform for the campaign (e.g., Instagram, YouTube)
    numberOfInfluencersNeeded: number; // Number of influencers they are looking for
    externalLinks: string[]; // Array to hold any number of external links
    viewsLastHour: number; // Number of influencers who viewed this in the last 1 hour
    lastReviewedTimeStamp: number | null; // Last time the brand reviewed the influencers

    proposals: ICollection<IProposals>; // Proposals for the collaboration
    invitaions: ICollection<IInvitations>; // Invitations for the collaboration

    // These data needs to come from api calls
    // aiGeneratedSuccessRate: number; // AI-generated success rate for influencer selection (e.g., percentage)
    // aiGeneratedResponseTime: string; // AI-generated estimate of how soon to expect the brand to respond (e.g., "2-3 days")
}

export interface IProposals {
    influencerId: string;
    collaborationId: string;
    status: string;
    timeStamp: number;
    message: string;
}

export interface IInvitations {
    influencerId: string;
    collaborationId: string;
    status: string;
    timeStamp: number;
    message: string;
}

