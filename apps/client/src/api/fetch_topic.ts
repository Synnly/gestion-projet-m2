import { UseAuthFetch } from '../hooks/useAuthFetch';
import type { Topic } from '../types/forum.types';
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

    return await response.json();
}

export async function fetchTopics({ forumId, page = 1, limit = 10, searchQuery }: FetchTopicsParams): Promise<PaginationResult<Topic>> {
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

    return await response.json();
}
