interface ILink {
    url: string;
    text: string;
}

interface IReel {
    id: string;
    /** @deprecated Use display_url instead - API response structure changed */
    thumbnail_url?: string;
    /** Image URL for reel thumbnail (current API field) */
    display_url?: string;
    url: string;
    caption: string;
    pinned: boolean;
    views_count: number | null;
    likes_count: number | null;
    comments_count: number | null;
}

export interface ISocials {
    id: string;
    social_type: string;

    gender: string;
    niches: string[];
    location: string;

    follower_count: number;
    following_count: number;
    content_count: number; // posts
    views_count: number; // views
    engagement_count: number; // engagement

    reel_scrapped_count: number; // scrapped reels

    average_views: number;
    average_likes: number;
    average_comments: number;
    quality_score: number;
    engagement_rate: number;

    username: string;
    name: string;
    bio: string;
    category: string;
    profile_pic: string;

    profile_verified: boolean;
    has_contacts: boolean;

    reels: IReel[];
    links: ILink[];

    has_follow_button: boolean;
    has_message_button: boolean;

    added_by: string;

    creation_time: number;
    last_update_time: number;
}

export interface ISocialAnalytics {
    quality: number;
    trustablity: number;
    estimatedBudget: {
        min: number;
        max: number;
    };
    estimatedReach: {
        min: number;
        max: number;
    };
    cpm: number
}

export interface SocialsBrief {
    id: string;
    name: string;
    username: string;
    profile_pic: string;
    follower_count: number;
    views_count?: number;
    engagement_count: number;
    engagement_rate: number;
    social_type?: string;
    location?: string;
    bio?: string;
    profile_verified?: boolean;
    creation_time?: number;
    last_update_time?: number;

    isDiscover?: boolean;
}