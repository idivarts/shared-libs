export const getSourcesPath = (orgId: string, sourceId?: string) => `/organizations/${orgId}/sources/${sourceId || ''}`

export enum SourceType {
    Facebook = "facebook",
    Instagram = "instagram",
    YouTube = "youtube",
    Email = "email"
}
export interface ISources {
    organizationId: string

    id: string;
    name: string;
    userId: string;
    ownerName: string;
    isWebhookConnected: boolean;
    status: number;

    userName?: string;
    bio?: string;
    sourceType: SourceType;
    connectedId?: string;
    campaignId?: string
}