import { ModelStatus } from "./status";

export interface InfluencerInvite {
    influencerId: string,
    category: string,
    reason: string,
    collabType?: string[],
    exampleLink?: string,
    platforms?: string[],
    collabMode?: "free" | "paid",
    budget?: {
        min: number,
        max: number
    },
    status: ModelStatus,
}