// import {  } from "firebase/firestore";

import { ICampaigns } from "./campaigns"
import { ICollection } from "./collections"
import { ILeads } from "./leads"
import { IMembers } from "./members"
import { ISources } from "./sources"

export const getOrganizationPath = (orgId: string) => `/organizations/${orgId}`

export interface IOrganizations {
    name: string
    createdBy: string,
    createdAt: number

    image?: string
    description?: string
    industry?: string
    website?: string
    
    // This field will be used to store the openAI key
    openAIKey?: string,

    organizationMembers?: ICollection<IOrganizationMembers>

    campaigns?: ICollection<ICampaigns>
    leads?: ICollection<ILeads>
    sources?: ICollection<ISources>
    members?: ICollection<IMembers>
}

export interface IOrganizationMembers{
    userId: string,
    organizationId: string,
    permissions: string[]
}