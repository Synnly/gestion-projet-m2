import { useQuery } from '@tanstack/react-query';
import type { PaginationResult } from '../types/internship.types.ts';
import { useEffect } from 'react';
import type { Application } from '../types/application.types.ts';
import { useApplicationStore } from '../store/applicationStore.ts';
import { buildQueryParams } from './useFetchInternships.ts';

const API_URL = import.meta.env.VITE_APIURL;

/**
 * Fetch applications for a given post with query parameters
 * @param API_URL The base API URL
 * @param postId The ID of the post
 * @param params The URL search parameters
 * @returns A promise resolving to the pagination result of applications
 */
export async function fetchApplications(API_URL: string, postId: string, params: URLSearchParams) {
    const res = await fetch(`${API_URL}/api/posts/${postId}/applications?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Erreur lors de la récupération des candidatures');
    }

    return res.json();
}

/**
 * Custom hook to fetch applications using React Query and synchronize with application store
 * @param postId The ID of the post to fetch applications for
 * @returns The React Query result object for applications
 */
export function useFetchApplications(postId: string) {
    const filters = useApplicationStore((state) => state.filters);
    const setApplications = useApplicationStore((state) => state.setApplications);
    const query = useQuery<PaginationResult<Application>, Error>({
        queryKey: ['applications', filters],

        queryFn: async () => {
            const params = buildQueryParams(filters);
            return await fetchApplications(API_URL, postId, params);
        },

        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // Synchroniser le store avec les données retournées par React Query (y compris cache)
    useEffect(() => {
        if (query.data && typeof setApplications === 'function') {
            setApplications(query.data);
        }
    }, [query.data, setApplications]);

    return query;
}
