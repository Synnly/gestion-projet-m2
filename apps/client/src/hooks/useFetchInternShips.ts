import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useInternShipStore } from '../store/useInternShipStore';
import type { InternShip, PaginationResult } from '../types/internship.types';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

interface Company {
    _id: string;
    name: string;
    email: string;
    logo?: string;
    city?: string;
    country?: string;
}

/**
 * Hook React Query pour récupérer les stages (internships)
 * - Récupère toutes les compagnies
 * - Pour chaque compagnie, récupère ses posts via /api/company/:companyId/posts
 * - Applique les filtres localement
 * - Met à jour le store avec les données récupérées
 * - Utilise un staleTime de 5 minutes
 * - Refetch automatiquement si les filtres changent
 */
export const useFetchInternShips = () => {
    const filters = useInternShipStore((state) => state.filters);
    const setInternships = useInternShipStore((state) => state.setInternships);

    const query = useQuery<PaginationResult<InternShip>, Error>({
        queryKey: ['internships', filters],
        queryFn: async () => {
            console.debug('[useFetchInternShips] start fetch', {
                page: filters.page,
                limit: filters.limit,
                sector: filters.sector,
                type: filters.type,
                searchQuery: filters.searchQuery,
            });
            // 1. Récupérer toutes les compagnies
            const companiesResponse = await fetch(`${API_URL}/api/companies`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!companiesResponse.ok) {
                const error = await companiesResponse.json();
                throw new Error(error.message || 'Erreur lors de la récupération des compagnies');
            }

            const companies: Company[] = await companiesResponse.json();

            // 2. Pour chaque compagnie, récupérer ses posts
            const allPostsPromises = companies.map(async (company) => {
                try {
                    // Construire les query params pour la pagination
                    const params = new URLSearchParams();
                    params.append('page', '1');
                    params.append('limit', '1000'); // Grande limite pour récupérer tous les posts

                    const postsResponse = await fetch(
                        `${API_URL}/api/company/${company._id}/posts?${params.toString()}`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                        }
                    );

                    if (!postsResponse.ok) {
                        console.warn(`Erreur lors de la récupération des posts pour ${company.name}`);
                        return [];
                    }

                    const postsData: PaginationResult<InternShip> = await postsResponse.json();
                    return postsData.data;
                } catch (error) {
                    console.warn(`Erreur pour la compagnie ${company.name}:`, error);
                    return [];
                }
            });

            const allPostsArrays = await Promise.all(allPostsPromises);
            // raw count before dedupe
            const rawCount = allPostsArrays.flat().length;
            let allPosts = allPostsArrays.flat();

            // Dédupliquer les posts par _id (par sécurité si plusieurs companies retournent des doublons)
            const seen = new Map<string, InternShip>();
            for (const p of allPosts) {
                if (!p || !p._id) continue;
                if (!seen.has(p._id)) seen.set(p._id, p);
            }
            allPosts = Array.from(seen.values());

            // Trier de façon stable (par _id) pour garantir une pagination déterministe
            allPosts.sort((a, b) => (a._id > b._id ? 1 : a._id < b._id ? -1 : 0));

            console.debug('[useFetchInternShips] after dedupe', { rawCount, deduped: allPosts.length });

            // 3. Appliquer les filtres localement
            if (filters.sector) {
                allPosts = allPosts.filter((post) => 
                    post.sector?.toLowerCase().includes(filters.sector!.toLowerCase())
                );
            }
            if (filters.type) {
                allPosts = allPosts.filter((post) => post.type === filters.type);
            }
            if (filters.minSalary !== undefined) {
                allPosts = allPosts.filter((post) => 
                    post.minSalary !== undefined && post.minSalary >= filters.minSalary!
                );
            }
            if (filters.maxSalary !== undefined) {
                allPosts = allPosts.filter((post) => 
                    post.maxSalary !== undefined && post.maxSalary <= filters.maxSalary!
                );
            }
            if (filters.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                allPosts = allPosts.filter((post) => 
                    post.title.toLowerCase().includes(query) ||
                    post.description.toLowerCase().includes(query) ||
                    post.company.name.toLowerCase().includes(query) ||
                    post.sector?.toLowerCase().includes(query)
                );
            }

            console.debug('[useFetchInternShips] after filters', { filtered: allPosts.length });
            console.debug('[useFetchInternShips] sampleIds', allPosts.slice(0, 10).map((p) => p._id));

            // 4. Calculer la pagination
            const total = allPosts.length;
            const totalPages = Math.ceil(total / filters.limit);
            const startIndex = (filters.page - 1) * filters.limit;
            const endIndex = startIndex + filters.limit;
            const paginatedPosts = allPosts.slice(startIndex, endIndex);

            const paginationResult: PaginationResult<InternShip> = {
                data: paginatedPosts,
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages,
                hasNext: filters.page < totalPages,
                hasPrev: filters.page > 1,
            };

            console.debug('[useFetchInternShips] paginationResult', {
                page: paginationResult.page,
                total: paginationResult.total,
                totalPages: paginationResult.totalPages,
                returned: paginationResult.data.length,
            });

            return paginationResult;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 2,
    });

    // Synchroniser le store avec les données retournées par React Query (y compris cache)
    useEffect(() => {
        if (query.data) {
            setInternships(query.data);
        }
    }, [query.data, setInternships]);

    return query;
};
