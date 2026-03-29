import { ICollection } from "../../collections";
import { Attachment } from "../constants/attachment";
import { InfluencerInvite } from "./influencerInvites";
import { INotifications } from "./notifications";
import { ISocials } from "./socials";


export type KYCStatus =
    | "not_started"
    | "in_progress"
    | "failed"
    | "approved";

export interface IUsers {
    name: string; // Name of the user
    profileImage?: string; // Profile image of the user
    email?: string; // Email of the user

    phoneNumber?: string; // Phone number of the user
    location?: string; // Location of the user
    isVerified?: boolean; // Verification status of the user

    isKYCDone?: boolean; // KYC verification status
    kyc?: {
        status: KYCStatus; // KYC status
        reason?: string; // optional failure reason
        updatedAt?: number; // Timestamp of the last update
        [key: string]: string | number | undefined;
    };

    panDetails?: {
        panNumber: string;              // e.g. INYPS4790X
        nameAsPerPAN: string;           // Rahul Sinha
        isVerified?: boolean;           // verified by KYC provider
        updatedAt?: number;
    };

    currentAddress?: {
        line1: string;                  // Address Line 1
        line2?: string;                 // Address Line 2
        city: string;
        state: string;
        postalCode: string;
        country?: string;               // Optional (default: India)
        updatedAt?: number;
    };

    shippingAddress?: {
        line1: string;                  // Address Line 1
        line2?: string;                 // Address Line 2
        city: string;
        state: string;
        postalCode: string;
        country?: string;               // Optional (default: India)
        updatedAt?: number;
    };

    bankDetails?: {
        accountNumber: string;          // 14 digits
        ifsc: string;
        accountHolderName: string;
        isVerified?: boolean;           // bank verification result
        updatedAt?: number;
    };



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
            influencerConectionGoals?: string
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

        gender?: string;
        quality?: number;
    };

    notifications: ICollection<INotifications>; // Notifications for the user
    socials: ICollection<ISocials>; // Social media accounts of the user
    pushNotificationToken: {
        ios?: string[];
        android?: string[];
        web?: string[];
    };

    connectedInfluencers?: string[]; // Array of connected influencer ids
    moderations?: {
        reportedCollaborations?: string[]// Array of reported collaborations ids
        blockedBrands?: string[] // Array of blocked brand ids
        blockedInfluencers?: string[]
        reportedInfluencers?: string[]
    }

    creationTime?: number,
    lastUseTime?: number,
    updateTime?: number,

    invitations?: ICollection<InfluencerInvite>; // Invitations sent to the user
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
