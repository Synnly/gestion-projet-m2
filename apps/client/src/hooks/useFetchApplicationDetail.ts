import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_APIURL;

export type ApplicationDetail = {
    _id: string;
    status: string;
    post: {
        _id: string;
        title: string;
        description?: string;
        duration?: string;
        type?: string;
        adress?: string;
        company?: {
            _id: string;
            name?: string;
        };
    };
    student?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    cv?: string;
    coverLetter?: string;
};

async function fetchApplicationDetail(id?: string): Promise<ApplicationDetail> {
    if (!id) throw new Error('Missing application id');

    const res = await fetch(`${API_URL}/api/application/${id}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible de récupérer la candidature');
    }

    return res.json();
}

export function useFetchApplicationDetail(id?: string) {
    return useQuery<ApplicationDetail, Error>({
        queryKey: ['application', id],
        queryFn: () => fetchApplicationDetail(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
