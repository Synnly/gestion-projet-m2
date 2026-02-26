import { useQuery } from '@tanstack/react-query';

interface UseAutocompleteOptions<T> {
    searchTerm: string;
    fetcher: (query: string) => Promise<T[]>;
    enabled: boolean;
    minChars?: number;
}

export function useAutocomplete<T>({ searchTerm, fetcher, enabled, minChars = 3 }: UseAutocompleteOptions<T>) {
    return useQuery({
        queryKey: ['autocomplete', searchTerm],
        queryFn: async () => {
            if (!searchTerm || searchTerm.length < minChars) return [];
            return fetcher(searchTerm);
        },
        enabled: enabled && searchTerm.length >= minChars,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
}
