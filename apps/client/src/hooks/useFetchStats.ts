import { useQuery } from '@tanstack/react-query';
import { UseAuthFetch } from './useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL;

export interface Stats {
    totalUsers: number;
    totalCompanies: number;
    totalStudents: number;
    totalApplications: number;
    totalPosts: number;
}

export function useFetchStats() {
    const authFetch = UseAuthFetch();

    return useQuery<Stats>({
        queryKey: ['stats'],
        queryFn: async () => {
            const res = await authFetch(`${API_URL}/api/stats`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch stats');
            }

            return res.json();
        },
    });
}