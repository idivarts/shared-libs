import { ICollection } from "../../collections";
import { Attachment } from "../constants/attachment";
import { INotifications } from "./notifications";
import { ISocials } from "./socials";

export interface IUsers {
  name: string; // Name of the user
  profileImage?: string; // Profile image of the user
  email?: string; // Email of the user

  phoneNumber?: string; // Phone number of the user
  location?: string; // Location of the user
  isVerified?: boolean; // Verification status of the user

  emailVerified?: boolean; // Email verification status
  phoneVerified?: boolean; // Phone verification status

  primarySocial?: string; // Primary social media account of the user
  isChatConnected?: boolean; // Chat connection status

  profile?: {
    completionPercentage?: number; // Profile completion percentage
    content?: {
      about?: string; // About of the user
      socialMediaHighlight?: string; // Highlight of the social media
      collaborationGoals?: string; // Collaboration goals
      audienceInsights?: string; // Audience insights
      funFactAboutUser?: string; // Fun fact about the user
    };
    introVideo?: string; // URL of the intro video

    category?: string[]; // Categories of the content created by the influencer

    attachments?: Attachment[];

    timeCommitment?: string; // Time commitment of the user
  };

  // dateOfBirth?: string; // Date of birth of the user
  preferences?: IPreferences; // User preferences

  settings?: {
    accountStatus?: AccountStatus; // Activated, Deactivated, Suspended
    availability?: string;
    dataSharing?: string;
    emailNotification?: boolean;
    profileVisibility?: string;
    pushNotification?: boolean;
    theme?: "light" | "dark";
  }; // User settings

  backend?: {
    // These contains all the data coming from backend. You cant update any of these
    followers?: number; // Number of followers,
    reach?: number; // Reach of the user
    engagement?: number; // Engagement of the user
    rating?: number; // Rating of the user
  };

  notifications: ICollection<INotifications>; // Notifications for the user
  socials: ICollection<ISocials>; // Social media accounts of the user
  pushNotificationToken: {
    ios?: string[];
    android?: string[];
    web?: string[];
  };

  moderations?: {
    reportedCollaborations?: string[]// Array of reported collaborations ids
    blockedBrands?: string[] // Array of blocked brand ids
    blockedInfluencers?: string[]
    reportedInfluencers?: string[]
  }

  creationTime?: number,
  lastUseTime?: number,
  updateTime?: number,
}

export interface IPreferences {
  budgetForPaidCollabs?: number[];
  // contentCategory?: string[];
  contentWillingToPost?: string[];
  goal?: string;
  maximumMonthlyCollabs?: number[];
  preferredBrandIndustries?: string[];
  preferredCollaborationType?: string;
  preferredLanguages?: string[];
  preferredVideoType?: string;
}

export enum AccountStatus {
  Activated = "Activated",
  Deactivated = "Deactivated",
  Deleted = "Deleted",
  Suspended = "Suspended",
}
