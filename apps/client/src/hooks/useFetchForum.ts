import type { PaginationResult } from '../types/internship.types.ts';
import type { Forum, ForumFilters } from '../types/forum.types.ts';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { forumStore } from '../store/forumStore.ts';

const API_URL = import.meta.env.VITE_APIURL;

/**
 * Build the query parameters for fetching forums
 * @param filters - The forum filters
 * @returns URLSearchParams object
 */
export function buildQueryParams(filters: ForumFilters) {
    const params = new URLSearchParams(
        Object.entries({
            page: filters.page ?? 1,
            limit: filters.limit ?? 12,
            searchQuery: filters.company,
        })
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
    );
    return params;
}

/**
 * Fetch forums from the API
 * @param params - The URL search parameters
 * @returns A promise resolving to the pagination result of forums
 */
export async function fetchForum(params: URLSearchParams) {
    const res = await fetch(`${API_URL}/api/forum/all?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Erreur lors de la récupération des forums');
    }

    return res.json();
}

/**
 * Custom hook to fetch forums using React Query and synchronize with the forum store
 * @returns The React Query result object
 */
export function useFetchForums() {
    const filters = forumStore((state) => state.filters);
    const setForums = forumStore((state) => state.setForums);
    const query = useQuery<PaginationResult<Forum>, Error>({
        queryKey: ['forums', filters],

        queryFn: async () => {
            const params = buildQueryParams(filters);

            const paginationResult = await fetchForum(params);

            // Filter out posts with missing company to avoid rendering invalid items
            const originalLength = paginationResult.data.length;
            const validPosts = paginationResult.data.filter((p: any) => p.company && typeof p.company === 'object');
            const removedCount = originalLength - validPosts.length;

            // Genral forum has no company, so allow one missing
            if (removedCount > 1) {
                try {
                    toast.error(`Impossible d'afficher ${removedCount} forum(s)`, {
                        toastId: 'fetch-forum',
                    });
                } catch (e) {
                    // ignore if toast not available
                }
            }
            paginationResult.data = validPosts;

            return paginationResult;
        },

        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // Synchronize the store with the data returned by React Query (including cache)
    useEffect(() => {
        if (query.data && typeof setForums === 'function') {
            setForums(query.data);
        }
    }, [query.data, setForums]);

    return query;
}

/**
 * Custom hook to fetch the general forum using React Query and synchronize with the forum store
 * @returns The React Query result object
 */
export function useFetchGeneralForum() {
    const setGeneralForum = forumStore((state) => state.setGeneralForum);
    const query = useQuery<Forum, Error>({
        queryKey: ['general-forum'],

        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/forum/general`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(error.message || 'Erreur lors de la récupération du forum général');
            }

            return res.json();
        },

        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // Synchronize the store with the data returned by React Query (including cache)
    useEffect(() => {
        if (query.data && typeof setGeneralForum === 'function') {
            setGeneralForum(query.data);
        }
    }, [query.data, setGeneralForum]);

    return query;
}
