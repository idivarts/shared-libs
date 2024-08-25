export const getMemberPath = (orgId: string, memberId?: string) => `/organizations/${orgId}/members/${memberId}`

export interface IMembers {
    userId: string,
    organizationId: string,
    permissions: {
        read?: boolean,
        write?: boolean,
        admin?: boolean
    }
}