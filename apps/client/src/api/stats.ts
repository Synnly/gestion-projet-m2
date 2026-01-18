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
