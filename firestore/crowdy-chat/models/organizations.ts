// import {  } from "firebase/firestore";

import { ICampaigns } from "./campaigns"
import { ICollection } from "./collections"
import { ILeads } from "./leads"
import { IMembers } from "./members"
import { ISources } from "./sources"

export const getOrganizationPath = (orgId: string) => `/organizations/${orgId}`

export interface IOrganizations {
    name: string
    createdBy: string, // user id of the person who has crated this firebase.auth.uid
    createdAt: number // Date.now()

    image?: string // storage url of the stored image
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