import { ICollection } from "../../collections";
import { IAdvanceFilters } from "./collaborations";
import { PromotionType } from "../constants/promotion-type";

export enum StrategyStatus {
    Draft = "draft",           // Strategy is being planned, not yet active
    Active = "active",         // Strategy is currently being executed
    Completed = "completed",   // Strategy has been completed
    Archived = "archived",     // Strategy is no longer relevant
}

export interface IStrategy {
    name: string; // Display name of the strategy (e.g., "Q3 2026 Diwali Campaign")
    managerId: string; // Manager who owns and created this strategy

    description?: string; // High-level overview of the strategy's intent
    objective?: string; // Primary marketing goal (e.g., "brand awareness", "sales", "engagement")

    status: StrategyStatus;

    // Epoch timestamps for the campaign window this strategy covers
    timeline?: {
        startDate: number;
        endDate: number;
    };

    // Platforms this strategy targets (e.g. Instagram, YouTube)
    platforms?: string[];

    // Content formats planned under this strategy (e.g. Reel, Story, Post)
    contentFormats?: string[];

    promotionType?: PromotionType; // Paid or Barter — the main deal structure for this strategy

    budget?: {
        total?: number;          // Total budget allocated for this strategy (in INR)
        perInfluencer?: number;  // Maximum per-influencer spend
    };

    // Target influencer profile for this strategy — reuses the discovery filter shape
    targetAudience?: IAdvanceFilters;

    numberOfInfluencers?: number; // How many influencers this strategy aims to work with

    // AI-generated or manually written markdown strategy document.
    // This is the full rich-text body shown in the strategy editor panel.
    markdownContent?: string;

    // IDs of collaborations that execute on this strategy — populated as collabs are created
    collaborationIds?: string[];

    // IDs of content pieces created under this strategy
    contents?: ICollection<IStrategyContent>;

    createdAt: number; // Epoch timestamp of when this strategy was created
    updatedAt: number; // Epoch timestamp of the last edit — update on every write
}

// Lightweight reference stored as a subcollection on the strategy to track linked content
export interface IStrategyContent {
    contentId: string; // ID of the content document in the brand's contents subcollection
    addedAt: number;   // Epoch timestamp of when this content was linked to the strategy
}
