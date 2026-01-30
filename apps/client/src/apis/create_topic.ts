import { UseAuthFetch } from '../hooks/useAuthFetch';
import type { CreateTopicPayload } from '../pages/forum/types';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

export async function createTopic({ forumId, data }: CreateTopicPayload) {
    const authFetch = UseAuthFetch();
    
    const response = await authFetch(`${API_URL}/api/forum/${forumId}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(data),
    });

    if (!response.ok) {
        const message = (await response.json().catch(() => null))?.message || 'Erreur lors de la création du topic';
        throw new Error(message);
    }

    // Si la réponse est 204 No Content, ne pas parser le JSON
    if (response.status === 204) {
        return null;
    }

    return await response.json();
}
