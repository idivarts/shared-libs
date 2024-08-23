export const getMemberPath = (orgId, memberId?) => `/organizations/${orgId}/members/${memberId}`

export interface IMembers {
    role: "admin" | "write" | "read"
    permissions: {
        "createCampaigns": boolean,
        "manageLeads": boolean
    }
    createdAt: number
}