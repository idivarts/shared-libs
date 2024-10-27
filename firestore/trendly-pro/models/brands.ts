import { ICollection } from "../../collections";
import { INotifications } from "./notifications";

export interface IBrands {
  name: string; // Name of the brand
  image?: string; // Image of the brand
  paymentMethodVerified?: boolean; // Indicates if the payment method is verified

  profile?: {
    about?: string; // About of the brand
    banner?: string; // Banner of the brand
    industry: string; // Industry of the brand
    website?: string; // Website of the brand
  },

  preferences?: {
    promotionType: string[]; // Promotion types (e.g., Barter, Paid)
    influencerCategory: string[]; // Influencer Category (Beauty, Fashion, etc.)
  }

  backend?: { // These would be updated only from backend
    hireRate?: number; // Brand hire rate (e.g., percentage)
  },

  survey?: { // This contains some survey about the trendly app
    source?: string; // Source from where you have heaed about us
    purpose?: string; // Purpose of using Trendly
    collaborationValue?: string; // Collaboration value
  }

  members: ICollection<IBrandsMembers>; // Members of the brand
  notifications: ICollection<INotifications>; // Notifications for the brand
}

export interface IBrandsMembers {
  brandId: string;
  managerId: string;

  designation?: string; // Designation of the member

  permissions?: {
    read?: boolean;
    write?: boolean;
    admin?: boolean;
  };
}
