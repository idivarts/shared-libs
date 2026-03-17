/**
 * Contract status as stored in Firestore.
 * Used by both Trendly-Brands and Trendly-Users when reading/writing contracts.
 */
export enum ContractStatus {
    Pending = 0,
    Started = 1,
    PaymentFailed = 2,
    Paid = 3,
    Shipped = 4,
    Delivered = 5,
    Received = 6,
    DeliverableSent = 7,
    PostScheduled = 8,
    PostDone = 9,
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
        paymentProofs?: unknown[];
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

/**
 * Form input when brand adds shipment details. Field names match the modal;
 * when writing to Firestore, map to Shipment (courierName → shipmentProvider, trackingNumber → trackingId, shipmentLink → notes).
 */
export interface ShipmentFormInput {
    courierName?: string;
    trackingNumber?: string;
    shipmentLink?: string;
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
