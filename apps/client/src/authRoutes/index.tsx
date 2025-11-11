import { redirect } from 'react-router';
import { userStore } from '../store/userStore';
import { Outlet } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
export type userContext = {
    access: string;
    role: string;
    isVerified: boolean;
};

/**
 * @description Function which refresh user session.
 *  @returns {Promise<string>} - The refreshed access token.
 */

async function refreshSession(): Promise<string> {
    const API_URL = import.meta.env.VITE_API_URL;
    const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    });

    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Refresh failed');

    const data = await res.text();
    return data;
}
/**
 * @description Middleware which verify if user is authenticated.
 *
 */
export const AuthRoutes = () => {
    const user: userContext | null = userStore((state) => state.user);
    const logout = userStore((state) => state.logout);
    const setUser = userStore((state) => state.set);
    const { data, isError } = useQuery({
        queryKey: ['auth', 'refresh'],
        queryFn: refreshSession,
        enabled: !!user,
        retry: 0,
        gcTime: 0,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: 'always',
        refetchOnReconnect: 'always',
    });

    if (!user) {
        throw redirect('/');
    }

    if (user && isError) {
        logout();
        return <Navigate to="/" replace />;
    }

    if (data) {
        setUser(data, user.role, user.isVerified);
    }

    return <Outlet context={user} />;
};
