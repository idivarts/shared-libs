import { ICollection } from "../../collections";
import { INotifications } from "./notifications";

export interface IBrands {
    name: string; // Name of the brand
    description?: string; // Description of the brand
    hireRate?: number; // Brand hire rate (e.g., percentage)
    paymentMethodVerified?: boolean; // Indicates if the payment method is verified

    members: ICollection<IBrandsMembers>; // Members of the brand
    notifications: ICollection<INotifications>; // Notifications for the brand
}

export interface IBrandsMembers {
    brandId: string;
    managerId: string;
    permissions?: {
        read?: boolean;
        write?: boolean;
        admin?: boolean
    }
}