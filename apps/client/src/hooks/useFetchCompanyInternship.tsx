import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { companyInternshipStore } from '../store/companyInternshipStore';
import type { Internship, InternshipFilters, PaginationResult } from '../types/internship.types';
import { userStore } from '../store/userStore';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { UseAuthFetch } from './useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL;
export function buildQueryParams(filters: InternshipFilters, companyId: string) {
    const params = new URLSearchParams(
        Object.entries({
            page: filters.page ?? 1,
            limit: filters.limit ?? 10,
            searchQuery: filters.searchQuery,
            company: companyId,
        })
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
    );
    return params;
}
export async function fetchPosts(API_URL: string, params: URLSearchParams, companyId: string) {
    const authFetch = UseAuthFetch();
    const res = await authFetch(`${API_URL}/api/company/${companyId}/posts?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Erreur lors de la récupération des posts');
    }

    return res.json();
}
export function useFetchCompanyInternships() {
    const access = userStore((state) => state.access);
    const getPayload = userStore((state) => state.get);
    const companyId = getPayload(access)?.id;
    const filters = companyInternshipStore((state) => state.filters);
    const setInternships = companyInternshipStore((state) => state.setInternships);
    const query = useQuery<PaginationResult<Internship>, Error>({
        queryKey: ['companyInternships', filters],

        queryFn: async () => {
            /** 1) Query params */
            const params = buildQueryParams(filters, companyId!);

            /** 2) Fetch base posts */
            const paginationResult = await fetchPosts(API_URL, params, companyId!);

            // Filter out posts with missing company to avoid rendering invalid items
            const originalLength = paginationResult.data.length;
            const validPosts = paginationResult.data.filter((p: any) => p.company && typeof p.company === 'object');
            const removedCount = originalLength - validPosts.length;
            if (removedCount > 0) {
                try {
                    toast.error(`Impossible d'afficher ${removedCount} stage(s)`, {
                        toastId: 'fetch-company-internships',
                    });
                } catch (e) {
                    // ignore if toast not available
                }
                paginationResult.data = validPosts;
            }

            return paginationResult;
        },
        placeholderData:keepPreviousData,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // Synchronize the store with the data returned by React Query (including cache)
    useEffect(() => {
        if (query.data && typeof setInternships === 'function') {
            setInternships(query.data);
        }
    }, [query.data, setInternships]);

    return query;
}
