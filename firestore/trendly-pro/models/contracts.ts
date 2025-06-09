import { Attachment } from "../constants/attachment";

export interface IContracts {
  brandId: string;
  managerId: string;
  userId: string;
  collaborationId: string;
  status: number; // 0: pending, 1: active, 2: Feedback, 3: completed
  streamChannelId: string;
  feedbackFromBrand?: {
    ratings?: number;
    feedbackReview?: string;
    managerId?: string;
    timeSubmitted?: number;
    paymentProofs: Attachment[]
  };
  feedbackFromInfluencer?: {
    ratings?: number;
    feedbackReview?: string;
    timeSubmitted?: number;
  };
  contractTimestamp: {
    startedOn: number;
    endedOn: number;
  };
}
