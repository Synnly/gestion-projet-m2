import type { Internship } from '../types/internship.types';
import type { PublicStats } from '../types/stats.ts';
import { fetchPublicSignedUrl } from '../hooks/useBlob';

export type { PublicStats };

const API_URL = import.meta.env.VITE_APIURL;

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

    const posts = (await response.json()) as Internship[];

    const uniqueLogoFiles = Array.from(
        new Set(posts.map((post) => post.company?.logo).filter((logo): logo is string => Boolean(logo))),
    );

    const signedResults = await Promise.all(
        uniqueLogoFiles.map(async (logo) => {
            const signedUrl = await fetchPublicSignedUrl(logo);
            return [logo, signedUrl] as const;
        }),
    );

    const signedMap = new Map<string, string | null>(signedResults);

    return posts.map((post) => {
        const logoFile = post.company?.logo;
        if (!logoFile) return post;

        const signedUrl = signedMap.get(logoFile);
        if (!signedUrl) return post;

        return {
            ...post,
            company: {
                ...post.company,
                logoUrl: signedUrl,
            },
        };
    });
};
