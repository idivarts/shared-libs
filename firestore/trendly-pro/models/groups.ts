import { ICollection } from "../../collections";

export interface IGroups {
  name: string; // Name of the group -> Collaboration name
  collaborationId: string; // Collaboration ID

  userIds: string[]; // User IDs in the group -> Application UserID
  managerIds: string[]; // Manager IDs in the group -> Manager who accepted the application

  messages: ICollection<IMessages>; // Messages in the group
  latestMessage?: IMessages; // Latest message in the group
  updatedAt: number; // Last updated date and time
  lastUserReadTime: {
    [userId: string]: number;
  }[]; // Last time the user read the messages
  lastManagerReadTime: {
    [managerId: string]: number;
  }[]; // Last time the manager read the messages
}

// When a group is opened
// Load all the users and managers from the group
// Load paginated messages from the group (30 messages per page)
export interface IMessages {
  groupId: string; // Group ID
  senderId: string; // Sender ID
  userType: "user" | "manager"; // User type

  message?: string; // Message content
  attachments?: {
    type: "image" | "video" | "file";
    url: string;
  }[]; // Message attachments

  timeStamp: number; // Sent date and time
}
