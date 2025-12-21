import { UseAuthFetch } from '../hooks/useAuthFetch';
import { userStore } from '../store/userStore';

/**
 * @description A loader function to protect routes that require authentication. It checks for user authentication and profile completeness.
 * @param {Object} param0 - An object containing the request.
 * @param {Request} param0.request - The request object.
 * @returns {Promise<Response|void>} - Redirects to signin if not authenticated, or to complete-profil if profile is incomplete.
 */
export async function protectedMiddleware(): Promise<string | void> {
    const API_URL = import.meta.env.VITE_APIURL;
    const { access, set: setAccess, logout } = userStore.getState();
    const authFetch = UseAuthFetch();
    if (!access) {
        return;
    }

    const refreshRes = await authFetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}` },
    });

    if (!refreshRes.ok) {
        logout();
        return;
    }

    const refreshed = await refreshRes.text();
    setAccess(refreshed);
    return refreshed;
}
