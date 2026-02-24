import { UseAuthFetch } from '../hooks/useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

export async function banUser(userId: string, reason?: string): Promise<void> {
    const authFetch = UseAuthFetch();
    const params = new URLSearchParams();
    
    if (reason?.trim()) {
        params.append('reason', reason.trim());
    }

    const url = `${API_URL}/api/users/${userId}/ban${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await authFetch(url, {
        method: 'POST',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors du bannissement de l\'utilisateur');
    }
}
