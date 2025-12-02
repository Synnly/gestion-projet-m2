import React from 'react';

import { companyPostStore } from '../../../../store/companyInternshipStore';
import Pagination from '../../../../components/ui/pagination/Pagination';

export const CompanyInternshipsPagination: React.FC = () => {
    const pagination = companyPostStore((s) => s.pagination);
    const filters = companyPostStore((s) => s.filters);
    const setFilters = companyPostStore((s) => s.setFilters);

    if (!pagination) return null;

    const handlePageChange = (newPage: number) => {
        // Clamp requested page into a valid range using the latest known totalPages.
        const maxPage = pagination.totalPages ?? newPage;
        const target = Math.max(1, Math.min(newPage, maxPage));
        if (filters.page === target) return;
        setFilters({ page: target });
        // scroll not handled here; caller may handle UX
    };

    return (
        <div className="mt-3 w-full">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
        </div>
    );
};
