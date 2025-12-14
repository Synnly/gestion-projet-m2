import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    useApplicationStore,
    type ApplicationResponse,
} from '../store/useApplicationStore';
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

async function fetchApplications(
    studentId: string,
    filters: any,
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

export function useFetchApplications() {
    const access = userStore((s) => s.access);
    const getUser = userStore((s) => s.get);
    const studentId = useMemo(() => getUser(access ?? undefined)?.id ?? null, [getUser, access]);

    const filters = useApplicationStore((s) => s.filters);
    const setApplications = useApplicationStore((s) => s.setApplications);

    const query = useQuery<ApplicationResponse, Error>({
        queryKey: ['applications', studentId, filters],
        queryFn: () => fetchApplications(studentId as string, filters, access),
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
