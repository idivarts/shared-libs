export const getConversationPath = (orgId: string, campaignId: string, conversationId?: string) => `/organizations/${orgId}/campaigns/${campaignId}/conversations/${conversationId}`

export interface IConversation {
    // igsid: string; - This is no longer needed as this is stored in the leads table
    organizationId: string,
    campaignId: string,

    sourceId: string;
    threadId: string;
    leadId: string,

    lastMid: string;
    lastBotMessageTime: number;
    botMessageCount: number;
    isProfileFetched: boolean;

    phases: number[];
    currentPhase: number;
    collectibles: {
        [collectibleId: string]: string
    }
    messageQueue?: string;
    nextMessageTime?: number;
    nextReminderTime?: number;
    reminderQueue?: string;
    reminderCount: number;
    status: number;
}