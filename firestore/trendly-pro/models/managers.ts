import { ICollection } from "../../collections";
import { INotifications } from "./notifications";

export interface IManagers {
    name: string; // Name of the manager
    email: string; // Email of the manager
    phoneNumber: string; // Phone number of the manager
    location: string; // Location of the manager
    dateOfBirth: string; // Date of birth of the manager

    notifications: ICollection<INotifications>; // Notifications for the manager
}