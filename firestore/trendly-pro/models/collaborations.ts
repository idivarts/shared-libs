import { ICollection } from "../../collections";
import { Attachment } from "../constants/attachment";
import { ExternalLink } from "../constants/external-link";
import { PromotionType } from "../constants/promotion-type";

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
  location: {
    type: string; // E.g. On-Site, Remote
    name?: string; // Location name - applicable for on-site locations
    latlong?: {
      lat: number;
      long: number;
    }; // Latitude and longitude - applicable for on-site locations
  };

  externalLinks?: ExternalLink[];
  questionsToInfluencers?: string[];
  preferences: {
    timeCommitment: string;
    influencerNiche: string[];
    influencerRelation: string;
    preferredVideoType: string;
  };
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

// Empty Illustration (there are none in that category)
// Looking for past applications/invitations (but if there are past data available)

// total - 0 -> empty
// total - 5, active -> 0 -> Looking for past application (Illustration)
// total - 10, active -> 5, inactive -> 5 -> Data to seen | At the bottom looking for past?
// total - 10, active -> 10, inactive -> 0 -> Data

export interface IApplications {
  userId: string;
  collaborationId: string;
  status: string; // "active", "rejected", "accepted"
  timeStamp: number;
  message: string;
  quotation: string;
  answersFromInfluencer: {
    question: number;
    answer: string;
  }[];
  timeline: number;
  attachments: Attachment[];
  fileAttachments: {
    url: string;
    name: string;
    type: string;
  }[];
}

export interface IInvitations {
  userId: string;
  collaborationId: string;
  managerId: string;
  status: string; // "active", "inactive", "accepted"
  timeStamp: number;
  message: string;
}
