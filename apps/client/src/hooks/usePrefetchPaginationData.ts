import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PaginationResult } from '../types/internship.types';

// On définit une contrainte : l'objet doit avoir au moins 'page'
interface BaseFilters {
    page: number | string;
    limit?: number;
}

interface PrefetchOptions<T extends BaseFilters, E> {
    queryKey: string;
    filters: T;
    queryFn: (filters: T) => Promise<PaginationResult<E>>;
    hasNextPage: boolean | undefined;
    additionalKeys?: unknown[];
}

export const usePrefetchPaginationData = <T extends BaseFilters, E>({
    queryKey,
    filters,
    queryFn,
    hasNextPage,
    additionalKeys = [],
}: PrefetchOptions<T, E>) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (hasNextPage) {
            const nextFilters: T = {
                ...filters,
                page: Number(filters.page) + 1,
            };

            const fullQueryKey = [queryKey, ...additionalKeys, nextFilters];

            queryClient.prefetchQuery({
                queryKey: fullQueryKey,
                queryFn: () => queryFn(nextFilters),
                staleTime: 1000 * 60 * 5,
            });
        }
    }, [filters, hasNextPage, queryClient, queryKey, additionalKeys, queryFn]);
};
