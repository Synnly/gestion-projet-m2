const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuthenticatedFetch = () => {
    const refreshAccessToken = async () => {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error('Impossible de rafraîchir le token');
        }

        return res.json();
    };

    const authenticatedFetch = async (url: string, options?: RequestInit) => {
        let res = await fetch(`${API_URL}${url}`, {
            ...options,
            credentials: 'include',
        });

        if (res.status === 401) {
            try {
                await refreshAccessToken();
                res = await fetch(`${API_URL}${url}`, {
                    ...options,
                    credentials: 'include',
                });
            } catch (err) {
                throw new Error('Session expirée, veuillez vous reconnecter');
            }
        }

        if (!res.ok) {
            const errMsg = await res.text();
            throw new Error(errMsg || 'Erreur réseau');
        }

        return res.json();
    };

    return { authenticatedFetch };
};
