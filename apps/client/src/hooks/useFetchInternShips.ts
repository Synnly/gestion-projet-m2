import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useInternShipStore } from '../store/useInternShipStore';
import type { InternShip, PaginationResult } from '../types/internship.types';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

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
            console.debug('[useFetchInternShips] fetching page', {
                page: filters.page,
                limit: filters.limit,
                sector: filters.sector,
                type: filters.type,
                searchQuery: filters.searchQuery,
            });

            // Construire les query params pour la pagination et les filtres
            const params = new URLSearchParams();
            params.append('page', String(filters.page ?? 1));
            params.append('limit', String(filters.limit ?? 10));
            if (filters.sector) params.append('sector', filters.sector);
            if (filters.type) params.append('type', filters.type);
            if (filters.minSalary !== undefined) params.append('minSalary', String(filters.minSalary));
            if (filters.maxSalary !== undefined) params.append('maxSalary', String(filters.maxSalary));
            if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);

            const res = await fetch(`${API_URL}/api/company/0/posts?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(error.message || 'Erreur lors de la récupération des posts');
            }

            const paginationResult: PaginationResult<InternShip> = await res.json();
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
