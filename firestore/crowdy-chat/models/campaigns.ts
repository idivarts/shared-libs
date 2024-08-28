import { ICollection } from "./collections";
import { IConversation } from "./conversations";

export const getCampaignPath = (orgId: string, campaignId?: string) => `/organizations/${orgId}/campaigns/${campaignId}`

export interface ICampaigns {
    organizationId: string,

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
    conversations: ICollection<IConversation>;
}

interface LeadStage {
    organizationId: string,
    campaignId: string,

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
    organizationId: string,
    campaignId: string,
    leadStageId: string,

    name: string;
    type: string;
    description: string;
    mandatory: boolean;
}