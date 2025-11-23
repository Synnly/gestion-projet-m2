import React from 'react';
import { useInternShipStore } from '../../store/useInternShipStore';
import Pagination from '../../components/ui/pagination/Pagination';

const InternshipPagination: React.FC = () => {
    const pagination = useInternShipStore((s) => s.pagination);
    const filters = useInternShipStore((s) => s.filters);
    const setFilters = useInternShipStore((s) => s.setFilters);

    if (!pagination) return null;

    const handlePageChange = (newPage: number) => {
        // Clamp requested page into a valid range using the latest known totalPages.
        const maxPage = pagination.totalPages ?? newPage;
        const target = Math.max(1, Math.min(newPage, maxPage));
        if (filters.page === target) return;
        console.debug('[InternshipPagination] page change requested', {
            requested: newPage,
            target,
            current: filters.page,
            pagination,
        });
        setFilters({ page: target });
        // scroll not handled here; caller may handle UX
    };

    return (
        <div className="mt-3 w-full">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
        </div>
    );
};

export default InternshipPagination;
