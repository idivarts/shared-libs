// Organization is the top-level tenant above Brand. It owns a set of brands
// (capped by its plan) and is the single billing/subscription entity (billing
// moved Brand -> Org). The old per-brand credit system is removed; the new
// org-level token wallet is added later by the Credit System ticket, so there
// is intentionally no credits field here.

// IOrgAccessState is OUR app-level subscription access state (distinct from the
// raw Razorpay billingStatus). The paywall/lock + 1st-of-month cron drive it.
export type IOrgAccessState = "active" | "past_due" | "locked" | "canceled";

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
    // ── Org-level USD billing state machine (Credit ticket §5a/§6) ──
    provider?: string;                 // "razorpay" (web) | "revenuecat" (native IAP); future MoR
    accessState?: IOrgAccessState;     // app-level access control
    billingMode?: "recurring" | "invoice";
    billingAnchorDay?: number;         // always 1
    periodEnd?: number;                // end of current paid month (next 1st, or IAP expiry)
    proratedFirstMonth?: boolean;
    // ── Native In-App Purchase (RevenueCat) fields (provider === "revenuecat") ──
    store?: "apple" | "google";        // where the subscription is managed (cancel/manage deep-links there)
    providerRef?: string;              // store original transaction id
}

// IOrgEntitlements is the denormalized plan capability set (resolved from the
// plan key) the app uses to gate UI without re-deriving plan rules.
export interface IOrgEntitlements {
    maxBrands: number;
    maxSeats: number;
    analyticsTier: "locked" | "standard" | "full";
    approvals: boolean;
    inboxReply: boolean;               // false on free → Combined Social Inbox is view-only
    maxPostsPerMonth: number;          // -1 = unlimited
}

// IOrgTokenWallet is the single shared AI-token wallet for the org. Balance is in
// model-weighted AI tokens (baseline Gemini 3.5 Flash). Metered by real usage.
export interface IOrgTokenWallet {
    balance: number;                   // monthly allotment remaining this period
    monthlyAllotment: number;          // refilled on the 1st
    periodResetAt: number;             // epoch ms of next reset (the 1st)
    topupBalance: number;              // purchased packs; spent after balance, not reset monthly
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
    // Resolved plan entitlements + the shared AI token wallet (Credit ticket).
    entitlements?: IOrgEntitlements;
    tokenWallet?: IOrgTokenWallet;
    creationTime: number;
    // Soft-delete marker (epoch ms). Non-null => org is deleted.
    deletedAt?: number;
    // Set when this org attempted to purchase/restore a native IAP
    // subscription a store receipt shows as already owned by a DIFFERENT org
    // — subscriptions are not transferable between orgs. This org's plan is
    // left untouched (typically free); the frontend paywall reads this to show
    // an explanatory popup naming the org that already owns it. Cleared via
    // the dismiss-restore-conflict endpoint once shown.
    iapRestoreConflict?: IIapRestoreConflict;
}

export interface IIapRestoreConflict {
    conflictingOrgId: string;
    conflictingOrgName: string;
    conflictingOwnerEmail: string;
    occurredAt: number;
}

export type OrgRole = "org_owner" | "org_admin" | "member";

// organizations/{orgId}/orgMembers/{managerId}
export interface IOrganizationMember {
    managerId: string;
    role: OrgRole;
    status: number;
}

export const getOrganizationPath = (orgId: string) => `/organizations/${orgId}`;
