import { UseAuthFetch } from '../hooks/useAuthFetch';
import { fetchPublicSignedUrl } from '../hooks/useBlob';
import type { Topic as TopicDetail } from '../pages/forum/types';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

export interface PaginationResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface FetchTopicsParams {
    forumId: string;
    page?: number;
    limit?: number;
    searchQuery?: string;
}

export async function fetchTopicById(forumId: string, topicId: string): Promise<TopicDetail | null> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/forum/${forumId}/topics/${topicId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        const message = (await response.json().catch(() => null))?.message || 'Erreur lors de la récupération du topic';
        throw new Error(message);
    }

    const topic = await response.json();
    
    if (topic?.author?.logo) {
        const presignedUrl = await fetchPublicSignedUrl(topic.author.logo);
        if (presignedUrl) topic.author.logo = presignedUrl;
    }

    return topic;
}

export async function fetchTopics({ forumId, page = 1, limit = 10, searchQuery }: FetchTopicsParams): Promise<PaginationResult<TopicDetail>> {
    const authFetch = UseAuthFetch();
    
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (searchQuery) {
        params.append('searchQuery', searchQuery);
    }

    const response = await authFetch(`${API_URL}/api/forum/${forumId}/topics?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const message = (await response.json().catch(() => null))?.message || 'Erreur lors de la récupération des topics';
        throw new Error(message);
    }

    const paginationResult = await response.json();

    await Promise.all(
        paginationResult.data.map(async (topic: TopicDetail) => {
            if (topic.author?.logo) {
                const presignedUrl = await fetchPublicSignedUrl(topic.author.logo);
                if (presignedUrl) topic.author.logo = presignedUrl;
            }
        })
    );

    return paginationResult;
}
