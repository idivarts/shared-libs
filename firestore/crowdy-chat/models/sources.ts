export const getSourcesPath = (orgId: string, sourceId?: string) => `/organizations/${orgId}/sources/${sourceId}`

export interface ISources {
    pageId: string;
    connectedId: string;
    userId: string;
    ownerName: string;
    name: string;
    userName: string;
    bio: string;
    isInstagram: boolean;
    accessToken: string;
    isWebhookConnected: boolean;
    status: number;
}