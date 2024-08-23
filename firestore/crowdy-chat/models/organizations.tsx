export interface IOrganizations {
    name: string

    // Optional fields
    image?: string
    description?: string
    industry?: string
    website?: string

    // This field will be used to store the openAI key
    openAIKey?: string
}