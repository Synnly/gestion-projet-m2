import { useQuery } from '@tanstack/react-query';
import { fetchTopics, type PaginationResult } from '../api/fetch_topic';
import type { Topic } from '../types/forum.types';

interface FetchTopicsParams {
    forumId: string;
    page?: number;
    limit?: number;
    searchQuery?: string;
}

export function useFetchTopics({ forumId, page = 1, limit = 10, searchQuery }: FetchTopicsParams) {
    return useQuery<PaginationResult<Topic>, Error>({
        queryKey: ['topics', forumId, page, limit, searchQuery],
        queryFn: () => fetchTopics({ forumId, page, limit, searchQuery }),
        enabled: !!forumId,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
    });
}
