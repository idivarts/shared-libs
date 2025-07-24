import { ModelStatus } from "./status";

export interface InfluencerInvite {
    influencerId: string,
    category: string,
    reason: string,
    collabType?: string[],
    exampleLink?: string,
    platforms?: string[],
    collabMode?: "free" | "paid",
    budgetMin?: number,
    budgetMax?: number,
    status: ModelStatus,
}