export interface CompanyForum {
    _id: string;
    name?: string;
    siretNumber?: string;
    nafCode?: string;
    structureType?: string;
    legalStatus?: string;
    address: string;
    logo?: string;
    location?: { lat: number; lng: number } | string;
}

export interface UserForum {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
}

export interface Forum {
    _id: string;
    company?: CompanyForum;
    topics?: Topic[];
    nbTopics?: number;
    nbMessages?: number;
}

export interface Topic {
    _id: string;
    title: string;
    description: string;
    author: UserForum;
    messages: string[];
}

export interface ForumFilters {
    page: number;
    limit: number;
    sector?: string;
    company?: string;
    companyName?: string;
}
