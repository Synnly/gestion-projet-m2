import { UseAuthFetch } from '../hooks/useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

/**
 * Soft delete a message (Admin only).
 * @param messageId - The ID of the message to delete
 * @returns The deleted message
 */
export async function deleteMessage(messageId: string): Promise<void> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/forum/message/${messageId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const message = (await response.json().catch(() => null))?.message || 'Erreur lors de la suppression du message';
        throw new Error(message);
    }
}
