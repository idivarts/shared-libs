import { ICollection } from "../../collections";
import { INotifications } from "./notifications";
import { ISocials } from "./socials";

export interface IUsers {
  name: string; // Name of the user
  profileImage?: string; // Profile image of the user
  email?: string; // Email of the user

  phoneNumber?: string; // Phone number of the user
  location?: string; // Location of the user

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

    attachments?: {
      type: "image" | "video";
      appleUrl?: string;
      playUrl?: string;
      imageUrl?: string;
    }[];

    timeCommitment?: string; // Time commitment of the user
  };

  // dateOfBirth?: string; // Date of birth of the user
  preferences?: {
    question1?: string[];
    question2?: string[];
    question3?: string[];
    question4?: string[];
  }; // User preferences

  settings?: {
    theme?: "light" | "dark";
    emailNotification?: boolean;
    pushNotification?: boolean;
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
}

