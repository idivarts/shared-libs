export const getSourcesPath = (orgId: string, sourceId?: string) => `/organizations/${orgId}/sources/${sourceId}`

export interface ISources {
    pageId: string;
    name: string;
    userId: string;
    ownerName: string;
    isWebhookConnected: boolean;
    status: number;

    userName?: string;
    bio?: string;
    sourceType: "facebook" | "instagram" | "youtube" | "email";
    // isInstagram: boolean;
    connectedId?: string;
    accessToken?: string;
}