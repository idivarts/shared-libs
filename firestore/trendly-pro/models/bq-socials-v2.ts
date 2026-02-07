export interface ISocialLinkV2 {
    title: string;
    url: string;
    link_type: string;
}

export interface IPostV2 {
    id: string;
    type: string; // 'Sidecar' | 'Image' | 'Video'
    shortCode: string;
    caption: string;
    url: string;
    displayUrl: string;
    videoUrl?: string;
    likesCount: number | null;
    commentsCount: number | null;
    videoViewCount?: number;
    videoPlayCount?: number;
    videoDuration?: number;
    timestamp: string;
    locationName?: string;
    locationId?: string;
    isPinned?: boolean;
    childPosts?: IPostV2[];
}

export interface ISocialsV2 {
    id: string; // From scraper 'id' or existing 'id'
    username: string;
    name: string; // From 'fullName'
    bio: string; // From 'biography'
    profile_pic: string; // From 'profilePicUrl'
    profile_pic_hd?: string; // From 'profilePicUrlHD'
    category: string; // From 'businessCategoryName'

    social_type: string; // 'instagram'
    profile_verified: boolean; // From 'verified'

    follower_count: number;
    following_count: number;
    content_count: number; // From 'postsCount'

    // Analytics/Metrics (preserved from V1)
    views_count?: number;
    engagement_count?: number;
    engagement_rate?: number;
    average_views?: number;
    average_likes?: number;
    average_comments?: number;
    quality_score?: number;

    // Existing fields from V1 worth preserving
    gender?: string;
    niches?: string[];
    location?: string;

    // Scraper specific fields
    externalUrl?: string;
    links: ISocialLinkV2[];
    latest_posts: IPostV2[];
    latest_reels: IPostV2[];

    // Metadata
    added_by: string;
    creation_time: number;
    last_update_time: number;

    // Optional/Future use
    is_business_account?: boolean;
    highlight_reel_count?: number;
    has_contacts?: boolean;
}
