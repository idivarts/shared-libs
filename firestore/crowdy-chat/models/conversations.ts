export const getConversationPath = (orgId, campaignId, conversationId?) => `/organizations/${orgId}/campaigns/${campaignId}/conversations/${conversationId}`

export interface IConversation {
    // igsid: string; - This is no longer needed as this is stored in the leads table
    sourceId: string;
    threadId: string;
    leadId: string,

    lastMid: string;
    lastBotMessageTime: number;
    botMessageCount: number;
    isProfileFetched: boolean;

    phases: number[];
    currentPhase: number;
    information: {
        phase: number;
        engagement: string;
        engagement_unit: string;
        views: string;
        views_unit: string;
        video_category: string;
        brand_category: string;
        interestInService?: boolean;
        interestInApp?: boolean;
        collaboration_brand: string;
        collaboration_product: string;
    }
    messageQueue?: string;
    nextMessageTime?: number;
    nextReminderTime?: number;
    reminderQueue?: string;
    reminderCount: number;
    status: number;
}