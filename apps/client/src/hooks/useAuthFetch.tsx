import { redirect, useNavigate } from 'react-router-dom';
import { userStore } from '../store/userStore'; // ton zustand store

interface FetchOptions<TData = unknown> {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: TData;
    headers?: Record<string, string>;
}

export const UseAuthFetch = () => {
    const accessToken = userStore.getState().access;
    const setUserToken = userStore.getState().set;

    const authFetch = async <TData = unknown,>(url: string, options?: FetchOptions<TData>): Promise<Response> => {
        const doFetch = async (): Promise<Response> => {
            try {
                const res = await fetch(url, {
                    method: options?.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(options?.headers || {}),
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    },
                    body: options?.data ? JSON.stringify(options.data) : undefined,
                    credentials: 'include',
                });

                if (!res.ok) {
                    if (res.status === 401) throw new Error('UNAUTHORIZED');
                    throw new Error(`Erreur ${res.status}`);
                }

                return res;
            } catch (err) {
                if (err instanceof TypeError && err.message === 'Failed to fetch') {
                    throw new Error('Impossible de contacter le serveur (CORS ou réseau)');
                }
                throw err;
            }
        };

        try {
            return await doFetch();
        } catch (err) {
            if (err instanceof Error && err.message === 'UNAUTHORIZED') {
                // Refresh token
                try {
                    const refreshRes = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        credentials: 'include',
                    });

                    if (!refreshRes.ok) {
                        navigate('/signin');
                        throw new Error('Redirection vers signin');
                    }

                    // refresh renvoie le token en texte
                    const newAccessToken = await refreshRes.text();
                    setUserToken(newAccessToken);

                    // Retente la requête initiale avec le nouveau token
                    return await doFetch();
                } catch (refreshErr) {
                    redirect('/signin');
                    throw refreshErr;
                }
            }

            throw err;
        }
    };

    return authFetch;
};
