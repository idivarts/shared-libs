// Organization is the top-level tenant above Brand. It owns a set of brands
// (capped by its plan) and is the single billing/subscription entity (billing
// moved Brand -> Org). The old per-brand credit system is removed; the new
// org-level token wallet is added later by the Credit System ticket, so there
// is intentionally no credits field here.

export interface IOrgBilling {
    subscription?: string;
    paymentLinkId?: string;
    subscriptionUrl?: string;
    billingStatus?: string;
    isOnTrial?: boolean;
    trialEnds?: number;
    endsAt?: number;
    planKey?: string;
    planCycle?: string;
    status?: number;
}

export interface IOrganizations {
    name: string;
    image?: string;
    ownerId: string;
    // Denormalized list of (non-deleted) brand ids in this org — source of truth
    // for the maxBrands cap and the grouped brand switcher.
    brandIds: string[];
    billing?: IOrgBilling;
    planKey?: string;
    maxBrands: number;
    creationTime: number;
    // Soft-delete marker (epoch ms). Non-null => org is deleted.
    deletedAt?: number;
}

export type OrgRole = "org_owner" | "org_admin" | "member";

// organizations/{orgId}/orgMembers/{managerId}
export interface IOrganizationMember {
    managerId: string;
    role: OrgRole;
    status: number;
}

export const getOrganizationPath = (orgId: string) => `/organizations/${orgId}`;
