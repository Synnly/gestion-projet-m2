import { redirect } from 'react-router-dom';
import { userStore } from '../store/userStore';

/**
 * @description A loader function to protect routes that require authentication. It checks for user authentication and profile completeness.
 * @param {Object} param0 - An object containing the request.
 * @param {Request} param0.request - The request object.
 * @returns {Promise<Response|void>} - Redirects to signin if not authenticated, or to complete-profil if profile is incomplete.
 */
export async function protectedLoader(): Promise<Response | string> {
    const API_URL = import.meta.env.VITE_APIURL;
    const { access, set: setAccess, logout } = userStore.getState();

    if (!access) {
        return redirect('/signin');
    }

    const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${access}` },
    });

    if (!refreshRes.ok) {
        logout();
        return redirect('/signin');
    }

    const refreshed = await refreshRes.text();
    setAccess(refreshed);
    return refreshed;
}
