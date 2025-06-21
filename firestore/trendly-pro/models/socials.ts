export interface ISocials {
    id: string;
    name: string;
    image: string;
    isInstagram: boolean;
    connectedId?: string; // if facebook, it will show the insta id if its connected and viceversa
    userId: string;
    ownerName: string;
    instaProfile?: IInstagramProfile; // Instagram profile will only be present when isInstagram is true
    fbProfile?: IFacebookProfile; // Facebook profile will only be present when isInstagram is false
    socialScreenShots?: string[]
}

export interface IInstagramProfile {
    name: string;
    username: string;
    biography: string;
    id: string;
    profilePictureUrl: string;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    website: string;
    approxMetrics?: {
        views: string;
        interactions: string;
        followers: string;
    }
}

export interface IFacebookProfile {
    id: string;
    name: string;
    about: string;
    category: string;
    categoryList: {
        id: string;
        name: string;
    }[];
    phone: string;
    location: any; // Use a more specific type if the structure of 'location' is known
    website: string;
    emails: any; // Use a more specific type if the structure of 'emails' is known
    fanCount: number;
    followersCount: number;
    picture: {
        data: {
            url: string;
        }
    };
    cover: {
        source: string;
        id: string;
    };
}

