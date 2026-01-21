import { Attachment } from "../constants/attachment";

export interface IContracts {
    brandId: string;
    managerId: string;
    userId: string;
    collaborationId: string;
    status: number; // 0-12: various contract states
    streamChannelId: string;
    feedbackFromBrand?: {
        ratings?: number;
        feedbackReview?: string;
        managerId?: string;
        timeSubmitted?: number;
        paymentProofs: Attachment[]
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
    // Shipping and delivery fields (Status 4-5)
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    deliveryConfirmedAt?: number;
    deliveryProof?: string;
    deliveryNotes?: string;
    // Video submission fields (Status 6-11)
    videoUrl?: string;
    videoSubmittedAt?: number;
    revisionRequest?: {
        reason: string;
        requestedAt: number;
    };
    releaseScheduledFor?: number;
    releasePostedAt?: number;
}
