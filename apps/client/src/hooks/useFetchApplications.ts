import type { ApplicationStatus } from '../types/application.types.ts';
const API_URL = import.meta.env.VITE_APIURL;

/**
 * Fetch applications for a given post with query parameters
 * @param postId The ID of the post
 * @param params The URL search parameters for filtering/pagination
 * @param status The status of applications to fetch
 * @returns A promise resolving to the pagination result of applications
 */
export async function fetchApplications(postId: string, params: URLSearchParams, status: ApplicationStatus) {
    const res = await fetch(`${API_URL}/api/posts/${postId}/applications/${status}?${params}`, {
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
