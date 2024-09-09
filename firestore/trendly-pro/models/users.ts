import { ICollection } from "../../collections";
import { INotifications } from "./notifications";

export interface IUsers {
    name: string; // Name of the user
    email: string; // Email of the user
    phoneNumber: string; // Phone number of the user
    location: string; // Location of the user
    dateOfBirth: string; // Date of birth of the user
    preferences?: {
        theme?: 'light' | 'dark'
        question1: string,
        question2: string,
        question3: string
    } // User preferences

    notifications: ICollection<INotifications>; // Notifications for the user
    socials: ICollection<ISocials>; // Social media accounts of the user
}

export interface ISocials {
    userId: string; // User ID
    platform: string; // Social media platform
    handle: string; // Social media handle
    followers: number; // Number of followers
    following: number; // Number of accounts following
    posts: number; // Number of posts
    engagementRate: number; // Social media engagement rate
}