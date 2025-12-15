import { useEffect } from 'react';
import { useInternshipStore } from '../store/useInternshipStore';
import type { PaginationResult, Internship } from '../types/internship.types';
import { fetchPublicSignedUrl } from './useBlob';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_APIURL;

export function buildQueryParams(filters: any) {
    const params = new URLSearchParams();

    const setParam = (key: string, value: any) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
        } else {
            params.set(key, String(value));
        }
    };

    params.set('page', String(filters.page ?? 1));
    params.set('limit', String(filters.limit ?? 10));

    setParam('searchQuery', filters.searchQuery);
    setParam('title', filters.title);
    setParam('description', filters.description);
    setParam('duration', filters.duration);
    setParam('sector', filters.sector);
    setParam('type', filters.type);
    setParam('minSalary', filters.minSalary);
    setParam('maxSalary', filters.maxSalary);
    setParam('keySkills', filters.keySkills);
    setParam('city', filters.city);
    setParam('radiusKm', filters.radiusKm);
    setParam('sort', filters.sort);
    setParam('company', filters.company);
    return params;
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

export function useFetchInternships() {
    const filters = useInternshipStore((state) => state.filters);
    const setInternships = useInternshipStore((state) => state.setInternships);
    const query = useQuery<PaginationResult<Internship>, Error>({
        queryKey: ['internships', filters],

        queryFn: async () => {
            /** 1) Query params */
            const params = buildQueryParams(filters);

            /** 2) Fetch base posts */
            const paginationResult = await fetchPosts(API_URL, params);

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

    // Enregistrer la fonction refetch dans le store pour permettre le refetch lors du changement de filtres
    const setRefetchCallback = useInternshipStore((state) => state.setRefetchCallback);
    useEffect(() => {
        setRefetchCallback(query.refetch);
        return () => setRefetchCallback(null);
    }, [query.refetch, setRefetchCallback]);

    return query;
}

/**
 * Fetch a single internship by id and attach signed company logo if present.
 * Can be used directly as a queryFn for react-query in detail pages:
 *   useQuery(['internship', id], () => fetchInternshipById(id))
 */
export async function fetchInternshipById(id?: string): Promise<Internship | null> {
    if (!id) return null;

    const res = await fetch(`${API_URL}/api/company/0/posts/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Erreur lors de la récupération du post');
    }

    const json = await res.json().catch(() => null);
    if (!json) return null;

    try {
        const logoFile = json?.company?.logo;
        if (logoFile) {
            const signed = await fetchPublicSignedUrl(logoFile);
            if (signed) json.company.logoUrl = signed;
        }
    } catch (e) {}

    return json;
}
