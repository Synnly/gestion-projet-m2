import type { CreateTopicPayload } from '../pages/forum/types';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

export async function createTopic({ forumId, data }: CreateTopicPayload) {
    const response = await fetch(`${API_URL}/api/forum/${forumId}/topics`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const message = (await response.json().catch(() => null))?.message || 'Erreur lors de la création du topic';
        throw new Error(message);
    }

    return await response.json();
}
