import { redirect } from 'react-router-dom';
import { userStore } from '../store/userStore'; // ton zustand store

interface FetchOptions<TData = unknown> {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: TData;
    headers?: Record<string, string>;
}
/**
 * example of usage:
 * const authFetch = UseAuthFetch();
 * const response = await authFetch('/api/some-endpoint', {
 *     method: 'POST',
 *     data: JSON.stringify({ key: 'value' }),
 *     headers: {
 *         'Custom-Header': 'CustomValue'
 *     }
 * });
 *not need to set Authorization header and credentials, it's handled automatically
 */
export const UseAuthFetch = () => {
    const accessToken = userStore.getState().access;
    const setUserToken = userStore.getState().set;

    const authFetch = async <TData = unknown,>(url: string, options?: FetchOptions<TData>): Promise<Response> => {
        const doFetch = async (): Promise<Response> => {
            try {
                const headers: Record<string, string> = {
                    ...(options?.headers || {}),
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                };

                if (!(options?.data instanceof FormData)) {
                    headers['Content-Type'] = 'application/json';
                }

                const res = await fetch(url, {
                    method: options?.method || 'GET',
                    headers: headers,
                    body: options?.data instanceof FormData ? options.data : JSON.stringify(options?.data),
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
                const apiUrl = import.meta.env.VITE_APIURL || 'http://localhost:3000';
                // Refresh token
                try {
                    const refreshRes = await fetch(`${apiUrl}/api/auth/refresh`, {
                        method: 'POST',
                        credentials: 'include',
                    });

                    if (!refreshRes.ok) {
                        redirect('/signin');
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
