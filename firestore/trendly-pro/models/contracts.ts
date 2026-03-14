import { Attachment } from "../constants/attachment";

/**
 * Contract status values follow the ContractStatus enum in shared-constants (1–14).
 * Legacy: 0 was used for "pending" in old flow; treat as CONTRACT_PENDING (2) when reading.
 */
export type ContractStatusNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type PaymentStatusFromProvider = "pending" | "processing" | "completed" | "failed";

export type ReleasePlanOption = "brand_and_influencer_post" | "influencer_posts_alone" | "brand_posts_alone";

export interface ContractShippingDetails {
    courierName?: string;
    trackingNumber?: string;
    shipmentLink?: string;
    shippedAt: number;
}

export interface ContractReleasePlan {
    option: ReleasePlanOption;
    scheduledReleaseAt: number; // timestamp
}

export interface IContracts {
    brandId: string;
    managerId: string;
    userId: string;
    collaborationId: string;
    /** Contract state (1–14). See shared-constants ContractStatus. Legacy: 0 = pending. */
    status: number;
    streamChannelId: string;
    /** From payments/escrow provider (e.g. Razorpay). Used for Payment Pending / Failed / Successful. */
    paymentStatus?: PaymentStatusFromProvider;
    /** Set when brand adds shipment (State 6 → 7). */
    shippingDetails?: ContractShippingDetails;
    /** Set when brand plans release (State 11 → 12). */
    releasePlan?: ContractReleasePlan;
    feedbackFromBrand?: {
        ratings?: number;
        feedbackReview?: string;
        managerId?: string;
        timeSubmitted?: number;
        paymentProofs: Attachment[];
    };
    feedbackFromInfluencer?: {
        ratings?: number;
        feedbackReview?: string;
        timeSubmitted?: number;
    };
    contractTimestamp: {
        startedOn: number;
        endedOn: number;
    };
}
