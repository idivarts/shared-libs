// import {  } from "firebase/firestore";

import { ICampaigns } from "./campaigns"
import { ICollection } from "./collections"
import { ILeads } from "./leads"
import { IMembers } from "./members"
import { ISources } from "./sources"

export const getOrganizationPath = (orgId) => `/organizations/${orgId}`

export interface IOrganizations {
    name: string
    image?: string
    description?: string
    industry?: string
    website?: string

    // This field will be used to store the openAI key
    openAIKey?: string,

    campaigns?: ICollection<ICampaigns>
    leads?: ICollection<ILeads>
    sources?: ICollection<ISources>
    members?: ICollection<IMembers>
}