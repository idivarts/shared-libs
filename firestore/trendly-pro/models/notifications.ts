
export interface INotifications {
    title: string; // Title of the notification
    description: string; // Description of the notification
    timeStamp: number; // Posted date and time
    isRead: boolean; // Indicates if the notification is read
    data?: {
        // Mixed
        collaborationId?: string,
        groupId?: string,
    }
    type: string; // Type of notification (e.g., invite(users), applications(managers), applications-accept(users))
}
