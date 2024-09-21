import { ICollection } from "../../collections";
import { IConversation } from "./conversations";

export const getCampaignPath = (orgId: string, campaignId?: string) =>
  `/organizations/${orgId}/campaigns/${campaignId}`;

export interface ICampaigns {
    organizationId: string;

    name: string;
    objective: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
    status: number;

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
  
    assistantId?: string
  
    leadStages?: ICollection<ILeadStage>;
    conversations: ICollection<IConversation>;
}

export interface ILeadStage {
  organizationId: string;
  campaignId: string;

  name: string;
  purpose: string;
  collectibles: ICollection<ICollectible>;
  reminders: {
    state: boolean;
    reminderCount: number;
    reminderExamples: string;
  };
  exampleConversations: string;
  stopConversation: boolean;
  leadConversion: boolean;
}

export interface ICollectible {
  organizationId: string;
  campaignId: string;
  leadStageId: string;

  name: string;
  type: string;
  description: string;
  mandatory: boolean;
}
