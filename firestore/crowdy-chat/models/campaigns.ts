import { ICollection } from "./collections";

export const getCampaignPath = (orgId: string, campaignId?: string) => `/organizations/${orgId}/campaigns/${campaignId}`

export interface ICampaigns {
    name: string;
    objective: string;
    createdBy: string
    createdAt: number
    updatedAt: number
    status: number

    replySpeed: {
        min: number;
        max: number;
    };
    reminderTiming: {
        min: number;
        max: number;
    };
    chatgpt: {
        prescript: string;
        purpose: string;
        actor: string;
        examples: string;
    };
    leadStages: ICollection<LeadStage>;
}

interface LeadStage {
    name: string;
    purpose: string;
    collectibles: ICollection<Collectible>;
    reminders: {
        state: boolean;
        reminderCount: number;
        reminderExamples: string;
    };
    exampleConversations: string;
    stopConversation: boolean;
    leadConversion: boolean;
}

interface Collectible {
    name: string;
    type: string;
    description: string;
    mandatory: boolean;
}