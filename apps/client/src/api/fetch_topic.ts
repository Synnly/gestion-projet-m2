import type { Topic } from '../pages/forum/types';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

export async function fetchTopicById(forumId: string, topicId: string): Promise<Topic | null> {
    const response = await fetch(`${API_URL}/api/forum/${forumId}/topics/${topicId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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
