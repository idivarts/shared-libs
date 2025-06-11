import { ICollection } from "../../collections";
import { INotifications } from "./notifications";

export interface IManagers {
  name: string; // Name of the manager
  email: string; // Email of the manager
  phoneNumber?: string; // Phone number of the manager
  location?: string; // Location of the manager
  // dateOfBirth?: string; // Date of birth of the manager

  isChatConnected?: boolean; // Chat connection status
  isAdmin?: boolean,

  notifications?: ICollection<INotifications>; // Notifications for the manager

  profileImage?: string;
  settings?: {
    theme?: "light" | "dark";
    emailNotification?: boolean;
    pushNotification?: boolean;
  };
  pushNotificationToken: {
    ios?: string[];
    android?: string[];
    web?: string[];
  };

  // TODO: This needs to be added on the backend as well
  moderations?: {
    blockedInfluencers?: string[] // Array of blocked brand ids
    reportedInfluencers?: string[]
  },
  // TODO: This needs to be added on the backend as well
  creationTime: number
}
