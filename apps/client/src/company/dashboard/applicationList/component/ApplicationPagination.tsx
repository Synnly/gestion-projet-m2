import { useApplicationStore } from '../../../../store/applicationStore.ts';
import Pagination from '../../../../components/ui/pagination/Pagination.tsx';

export const ApplicationPagination = () => {
    const pagination = useApplicationStore((s) => s.pagination);
    const filters = useApplicationStore((s) => s.filters);
    const setFilters = useApplicationStore((s) => s.setFilters);

    if (!pagination) return null;

    const handlePageChange = (newPage: number) => {
        const maxPage = pagination.totalPages ?? newPage;
        const target = Math.max(1, Math.min(newPage, maxPage));
        if (filters.page === target) return;
        setFilters({ page: target });
    };

    return (
        <div>
            <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                className="!py-0"
            />
        </div>
    );
};
