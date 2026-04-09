/**
 * Contract and monetization enums aligned with backend:
 * `backend-sls/internal/models/trendlymodels/monetization_enums.go`
 *
 * `ContractStatus` numeric values match the backend; member names are frontend-oriented for readability.
 * Used by Trendly frontends when reading/writing contracts in Firestore.
 */
export enum ContractStatus {
    Pending = 0,
    /** Same as backend `OrderCreated` (1). */
    Started = 1,
    PaymentFailed = 2,
    ShipmentPending = 3,
    /** Same as backend `Shipped` (4). */
    DeliveryPending = 4,
    /** Same as backend `Delivered` (5). */
    DeliveryAcknowledgementPending = 5,
    /** Same as backend `DeliverablePending` (6). */
    VideoPending = 6,
    /** Same as backend `DeliverableSent` (7). */
    ReviewPending = 7,
    /** Same as backend `PostScheduled` (8). */
    PostingPending = 8,
    /** Same as backend `PostDone` (9). */
    SettlementPending = 9,
    Settled = 10,
}

export enum PaymentStatus {
    WaitingForPayment = "waiting-for-payment",
    Failed = "failed",
    Paid = "paid",
    TransferProcessed = "transfer-processed",
    TransferFailed = "transfer-failed",
}

export enum ShipmentStatus {
    Shipped = "shipped",
    Delivered = "delivered",
    Received = "received",
}

export enum DeliverableStatus {
    RevisionRequested = "revision-requested",
    Submitted = "submitted",
}

export enum PostingStatus {
    Approved = "approved",
    Rescheduled = "rescheduled",
    Posted = "posted",
}

export enum PostingScenario {
    InfluencerWillPost = "influencer-will-post",
    InfluencerAndBrandCollabPost = "influencer-and-brand-collab-post",
    BrandWillUseVideoIndependently = "brand-will-use-video-independently",
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
    /** Mirrors backend `PaymentStatus` on the contract payment sub-object */
    status?: PaymentStatus;
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
    status?: ShipmentStatus;
    notes?: string;
    receivedNotes?: string;
}

export interface Deliverable {
    status?: DeliverableStatus;
    deliverableLinks?: string[];
    notes?: string;
    revisionCount?: number;
    revisionNotes?: string[];
}

export interface Posting {
    scheduledDate?: number;
    status?: PostingStatus;
    postedLinks?: string[];
    postingScenario?: PostingScenario;
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
