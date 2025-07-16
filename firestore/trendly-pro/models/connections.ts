export interface IConnections {
    fromUserId: string; // User ID of the influencer
    toUserId: string; // User ID of the brand
    timeStamp: number; // Timestamp of when the connection was made
    lastUpdated?: number; // Timestamp of the last update to the connection
    connectionType?: "influencer-to-influencer" | "influencer-to-brand" | "brand-to-influencer"; // Type of connection
    message?: string; // Optional message sent with the connection request
    status: "pending" | "accepted" | "rejected" | "blocked"; // Status of the connection
}