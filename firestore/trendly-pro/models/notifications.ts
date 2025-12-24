export interface INotifications {
    title: string; // Title of the notification
    description: string; // Description of the notification
    timeStamp: number; // Posted date and time
    isRead: boolean; // Indicates if the notification is read
    data?: {
        // Mixed
        collaborationId?: string;
        groupId?: string;
        userId?: string;
    };
    type: "invitation" | "application-accepted" | "revise-quotation" | "contract-started" | "contract-ended" |
    "application" | "new-quotation" | "contract-start-request" | "contract-end-request" | "feedback-given"
}
