import { ICollection } from "../../collections";

export interface ICollaboration {
    name: string; // Name of the collaboration
    brandId: string; // Brand details
    description: string; // Description of the ad campaigns and objectives
    timeStamp: number; // Posted date and time
    cost: number; // Associated price or cost
    paymentMethodVerified: boolean; // Indicates if the payment method is verified
    promotionType: string; // Type of promotion (e.g., paid, barter)
    collaborationType: string; // Type of collaboration (e.g., long-term, short-term)
    location: string; // Location of the collaboration (e.g., city, country)
    platform: string; // Platform for the campaign (e.g., Instagram, YouTube)
    numberOfInfluencersNeeded: number; // Number of influencers they are looking for
    externalLinks: string[]; // Array to hold any number of external links
    numberOfApplications: number; // Number of persons applied
    aiGeneratedSuccessRate: number; // AI-generated success rate for influencer selection (e.g., percentage)
    aiGeneratedResponseTime: string; // AI-generated estimate of how soon to expect the brand to respond (e.g., "2-3 days")
    viewsLastHour: number; // Number of influencers who viewed this in the last 1 hour
    lastReviewedDateTime: number | null; // Last time the brand reviewed the influencers

    proposals: ICollection<IProposals>; // Proposals for the collaboration
    invitaions: ICollection<IInvitations>; // Invitations for the collaboration
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

