
export interface INotifications {
    title: string; // Title of the notification
    description: string; // Description of the notification
    timeStamp: number; // Posted date and time
    isRead: boolean; // Indicates if the notification is read
    type: string; // Type of notification (e.g., collaboration, message)
}