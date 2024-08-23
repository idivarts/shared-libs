export const getTagPath = (orgId, tagId?) => `/organizations/${orgId}/tags/${tagId}`

export interface ITags {
    name: string
}