/**
 * Contract status as stored in Firestore.
 * Used by both Trendly-Brands and Trendly-Users when reading/writing contracts.
 */
export enum ContractStatus {
    Pending = 0,
    StartedAndShipmentOrVideoPending = 1, // promotionSubject == "physical_product" ? Shipment Pending state : Video Pending state
    PaymentFailed = 2,
    DeliveryPending = 4,
    DeliveryAcknowledgementPending = 5,
    VideoPending = 6,
    ReviewPending = 7,
    PostingPending = 8,
    SettlementPending = 9, // Settlement Pending state - Feedback Open State
    Settled = 10,
}

export interface IContracts {
    brandId: string;
    managerId: string;
    userId: string;
    collaborationId: string;
    status: ContractStatus;
    streamChannelId: string;
    feedbackFromBrand?: {
        ratings?: number;
        feedbackReview?: string;
        managerId?: string;
        timeSubmitted?: number;
    };
    feedbackFromInfluencer?: {
        ratings?: number;
        feedbackReview?: string;
        timeSubmitted?: number;
    };
    contractTimestamp?: {
        startedOn: number;
        endedOn: number;
    };
    payment?: Payment;
    shipment?: Shipment;
    deliverable?: Deliverable;
    posting?: Posting;
    analytics?: Analytics;
    activity?: Activity[];
}

export interface Payment {
    /** orderId is used on Razorpay to fetch the payment details */
    orderId?: string;
    /** status is updated from frontend */
    status?: string;
    paymentId?: string;
    transferId?: string;
    /** shortUrl can be used to make the payment */
    shortUrl?: string;
    /** amount of the payment */
    amount?: number;
}

export interface Shipment {
    trackingId?: string;
    shipmentProvider?: string;
    expectedDate?: number;
    packageScreenshots?: string[];
    addressShippedTo?: unknown;
    status?: string;
    notes?: string;
    receivedNotes?: string;
}

export interface Deliverable {
    status?: string;
    deliverableLinks?: string[];
    notes?: string;
    revisionCount?: number;
    revisionNotes?: string[];
}

export interface Posting {
    scheduledDate?: number;
    status?: string;
    postedLinks?: string[];
    postingScenario?: string;
    proofScreenshot?: string;
    postUrl?: string;
    notes?: string;
}

export interface Analytics {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    impressions?: number;
}

export interface Activity {
    type?: string;
    time?: number;
    detail?: string;
    payload?: unknown;
}
