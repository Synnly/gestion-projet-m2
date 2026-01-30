export interface CompanyForum {
    _id: string;
    name?: string;
    siretNumber?: string;
    nafCode?: string;
    structureType?: string;
    legalStatus?: string;
    streetNumber?: string;
    streetName?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    logo?: string;
    location?: { lat: number; lng: number } | string;
}

export interface Forum {
    _id: string;
    company?: CompanyForum;
    topics?: Topic[];
    nbTopics?: number;
    nbMessages?: number;
}

export interface ForumFilters {
    page: number;
    limit: number;
    sector?: string;
    company?: string;
    companyName?: string;
}

import { z } from 'zod';

export const createTopicSchema = z.object({
    title: z
        .string()
        .min(1, { message: 'Le titre est requis' })
        .max(200, { message: 'Le titre ne peut pas dépasser 200 caractères' }),
    description: z.string().optional(),
});

export type CreateTopicForm = z.infer<typeof createTopicSchema>;

export type CreateTopicPayload = {
    forumId: string;
    data: {
        title: string;
        description?: string;
    };
};

export type Message = {
    _id: string;
    content: string;
    author: {
        _id: string;
        name: string;
        email?: string;
        avatar?: string;
    };
    createdAt: string;
    updatedAt: string;
};

export type Topic = {
    _id: string;
    title: string;
    description?: string;
    messages?: Message[];
    author: UserForum;
    forumId?: string;
    createdAt?: string;
    updatedAt?: string;
    nbMessages?: number;
};

export interface UserForum {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    logo?: string;
}

export type CreateTopicModalProps = {
    forumId: string;
    isOpen: boolean;
    onClose: () => void;
};

export const createMessageSchema = z.object({
    content: z
        .string()
        .min(1, { message: 'Le message ne peut pas être vide' })
        .max(5000, { message: 'Le message ne peut pas dépasser 5000 caractères' }),
    author: z.string().min(1, { message: "L'auteur est requis" }),
});

export type CreateMessageForm = z.infer<typeof createMessageSchema>;

export type CreateMessagePayload = {
    topicId: string;
    data: {
        content: string;
        author: string;
    };
};
