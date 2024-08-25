export const getTagPath = (orgId: string, tagId?: string) => `/organizations/${orgId}/tags/${tagId || ''}`

export interface ITags {
    name: string
}