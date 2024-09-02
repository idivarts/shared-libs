import { ICollection } from "../../collections";

export interface IGroups {
    name: string; // Name of the group
    collaborationId: string; // Collaboration ID

    userIds: string[]; // User IDs in the group
    managerIds: string[]; // Manager IDs in the group

    messages: ICollection<IMessages>; // Messages in the group
}

export interface IMessages {
    groupId: string; // Group ID
    senderId: string; // Sender ID
    message: string; // Message content
    attachments: string[]; // Message attachments
    timeStamp: number; // Sent date and time
}