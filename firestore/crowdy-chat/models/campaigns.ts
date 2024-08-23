export const getCampaignPath = (orgId, campaignId?) => `/organizations/${orgId}/campaigns/${campaignId}`

export interface ICampaigns {
    name: string
    description?: string
    status: number
    createdBy: string
    createdAt: number
    updatedAt: number
}