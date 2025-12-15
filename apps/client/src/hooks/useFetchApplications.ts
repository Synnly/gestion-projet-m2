import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApplicationStore, type ApplicationResponse } from '../store/useApplicationStore';
import { userStore } from '../store/userStore';

const API_URL = import.meta.env.VITE_APIURL;

function buildQueryParams(filters: Partial<{ page: number; limit: number; status?: string; searchQuery?: string }>) {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.status) params.set('status', filters.status);
    if (filters.searchQuery) params.set('searchQuery', filters.searchQuery);
    return params.toString();
}

/**
 * Fetch applications for a given student with query parameters
 * @param studentId The ID of the student
 * @param filters The filters for the query
 * @param access Optional access token for authorization
 * @returns A promise resolving to the pagination result of applications
 */
async function fetchApplicationsByStudent(
    studentId: string,
    filters: Partial<{ page: number; limit: number; status?: string; searchQuery?: string }>,
    access?: string | null,
): Promise<ApplicationResponse> {
    const qs = buildQueryParams(filters);
    const res = await fetch(`${API_URL}/api/application/student/${studentId}?${qs}`, {
        method: 'GET',
        credentials: 'include',
        headers: access ? { Authorization: `Bearer ${access}` } : undefined,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible de récupérer les candidatures');
    }
    return res.json();
}

/**
 * Fetch applications for a given post with query parameters
 * @param postId The ID of the post
 * @param filters The filters for the query
 * @returns A promise resolving to the pagination result of applications
 */
export async function fetchApplicationsByPost(
    postId: string,
    filters: Partial<{ page: number; limit: number; status?: string; searchQuery?: string }>,
) {
    const access = userStore.getState().access;
    const params = buildQueryParams(filters);
    const res = await fetch(`${API_URL}/api/application/post/${postId}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible de récupérer les candidatures');
    }
    return res.json();
}

export function useFetchApplications() {
    const access = userStore((s) => s.access);
    const getUser = userStore((s) => s.get);
    const studentId = useMemo(() => getUser(access ?? undefined)?.id ?? null, [getUser, access]);

    const filters = useApplicationStore((s) => s.filters);
    const setApplications = useApplicationStore((s) => s.setApplications);

    const query = useQuery<ApplicationResponse, Error>({
        queryKey: ['applications', studentId, filters],
        queryFn: () => fetchApplicationsByStudent(studentId as string, filters, access),
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Synchronise le store quand les données changent
    useEffect(() => {
        if (query.data) {
            setApplications(query.data);
        }
    }, [query.data, setApplications]);

    return query;
}

/**
 * Fetch signed URL for a file associated with an application
 * @param applicationId The ID of the application
 * @param type The type of file ("cv" or "lm")
 * @returns A promise resolving to the signed URL or null
 */
export const fetchFileSignedUrl = async (applicationId: string, type: 'cv' | 'lm'): Promise<string | null> => {
    const url = `${import.meta.env.VITE_APIURL}/api/application/${applicationId}/file/${type}`;
    const access = userStore.getState().access;

    try {
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: { Authorization: `Bearer ${access}` },
        });

        const data = await res.json();

        return data.downloadUrl || null;
    } catch (error) {
        return null;
    }
};

/**
 * Hook to get public signed URL from backend with caching
 * @param applicationId The ID of the application
 * @param type The type of file ("cv" or "lm")
 * @returns React Query result containing the signed URL or null
 */
export const useFetchFileSignedUrl = (applicationId: string | undefined, type: 'cv' | 'lm' | undefined) => {
    return useQuery({
        queryKey: ['publicSignedUrl', applicationId, type],
        queryFn: async () => {
            if (!applicationId || !type) return null;
            return await fetchFileSignedUrl(applicationId, type);
        },
        enabled: !!applicationId && !!type,
        staleTime: 1000 * 60 * 30, // cache 30 min
        retry: 1,
        gcTime: 1000 * 60 * 60, // Keep in cache for 1h
    });
};
