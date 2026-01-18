import type { Internship } from '../types/internship.types';

const API_URL = import.meta.env.VITE_APIURL;

export interface PublicStats {
    totalPosts: number;
    totalCompanies: number;
    totalStudents: number;
}

/**
 * Fetches public statistics for the landing page
 * No authentication required
 * @returns Promise resolving to public stats
 */
export const fetchPublicStats = async (): Promise<PublicStats> => {
    const response = await fetch(`${API_URL}/api/stats/public`);

    if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
    }

    return response.json();
};

/**
 * Fetches the latest internship posts for the landing page
 * No authentication required
 * @param limit - Number of posts to fetch (default: 6)
 * @returns Promise resolving to array of internships
 */
export const fetchLatestPosts = async (limit: number = 6): Promise<Internship[]> => {
    const response = await fetch(`${API_URL}/api/stats/public/posts?limit=${limit}`);

    if (!response.ok) {
        throw new Error('Erreur lors du chargement des offres');
    }

    return response.json();
};
