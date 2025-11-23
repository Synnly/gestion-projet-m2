import { useEffect } from 'react';
import { useInternShipStore } from '../store/useInternShipStore';
import type { PaginationResult, InternShip } from '../types/internship.types';
import { fetchPublicSignedUrl } from './useBlob';
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_APIURL;

export function buildQueryParams(filters: any) {
    return new URLSearchParams(
        Object.entries({
            page: filters.page ?? 1,
            limit: filters.limit ?? 10,
            searchQuery: filters.searchQuery,
        })
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
    );
}

export async function fetchPosts(API_URL: string, params: URLSearchParams) {
    const res = await fetch(`${API_URL}/api/company/0/posts?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Erreur lors de la récupération des posts');
    }

    return res.json();
}

export async function fetchCompanyProfiles(companyIds: string[], API_URL: string) {
    return Promise.all(
        companyIds.map(async (id) => {
            const res = await fetch(`${API_URL}/api/companies/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!res.ok) return { companyId: id, logo: null };

            const json = await res.json().catch(() => null);
            return { companyId: id, logo: json?.logo ?? null };
        }),
    );
}

export async function signLogos(profiles: { logo: string | null }[]) {
    const uniqueFiles = Array.from(new Set(profiles.map((p) => p.logo).filter((l): l is string => !!l)));

    const signedResults = await Promise.all(
        uniqueFiles.map(async (file) => {
            const signed = await fetchPublicSignedUrl(file);
            return [file, signed] as const;
        }),
    );

    return new Map<string, string | null>(signedResults);
}

export function applyLogosToPosts(posts: any[], profiles: any[], signedMap: Map<string, string | null>) {
    for (const post of posts) {
        const profile = profiles.find((p) => p.companyId === post.company?._id);
        const fileName = profile?.logo ?? post.company?.logo;

        if (fileName) {
            const url = signedMap.get(fileName);
            if (url) post.company.logoUrl = url;
        }
    }
}

export function useFetchInternShips() {
    const filters = useInternShipStore((state) => state.filters);
    const setInternships = useInternShipStore((state) => state.setInternships);
    const query = useQuery<PaginationResult<InternShip>, Error>({
        queryKey: ['internships', filters],

        queryFn: async () => {
            /** 1) Query params */
            const params = buildQueryParams(filters);

            /** 2) Fetch base posts */
            const paginationResult = await fetchPosts(API_URL, params);

            /** 3) Extract company IDs */
            const companyIds = Array.from(
                new Set(
                    paginationResult.data
                        .map((p: any) => p.company?._id)
                        .filter((id: string) => typeof id === 'string' && id.length > 0),
                ),
            ) as string[];

            if (companyIds.length > 0) {
                /** 4) Fetch profiles */
                const profiles = await fetchCompanyProfiles(companyIds, API_URL);

                /** 5) Sign logo URLs */
                const signedMap = await signLogos(profiles);

                /** 6) Apply logos to posts */
                applyLogosToPosts(paginationResult.data, profiles, signedMap);
            }

            return paginationResult;
        },

        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // Synchroniser le store avec les données retournées par React Query (y compris cache)
    useEffect(() => {
        if (query.data && typeof setInternships === 'function') {
            setInternships(query.data);
        }
    }, [query.data, setInternships]);


    return query;
}
