import React from 'react';

import { companyInternshipStore } from '../../../../store/companyInternshipStore';
import Pagination from '../../../../components/ui/pagination/Pagination';

export const CompanyInternshipsPagination: React.FC = () => {
    const pagination = companyInternshipStore((s) => s.pagination);
    const filters = companyInternshipStore((s) => s.filters);
    const setFilters = companyInternshipStore((s) => s.setFilters);

    if (!pagination) return null;

    const handlePageChange = (newPage: number) => {
        // Clamp requested page into a valid range using the latest known totalPages.
        const maxPage = pagination.totalPages ?? newPage;
        const target = Math.max(1, Math.min(newPage, maxPage));
        if (filters.page === target) return;
        setFilters({ page: target });
        // If scrolling to a specific position is desired after page change, handle it in the parent component.
    };

    return (
        <div className="mt-3 w-full">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
        </div>
    );
};
