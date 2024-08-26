import { SourceType } from "./sources"

export const getLeadPath = (orgId: string, leadId?: string) => `/organizations/${orgId}/leads/${leadId || ''}`

export interface ILeads {
    igsid?: string
    fbid?: string
    email?: string

    name?: string

    sourceType: SourceType
    sourceId: string

    userProfile?: UserProfile

    tagId?: string
    campaignId?: string
    status: number
    createdAt: number
    updatedAt: number
}

interface UserProfile {
    name: string;
    username: string;
    profile_pic: string;
    follower_count: number;
    is_user_follow_business: boolean;
    is_business_follow_user: boolean;
}
