import Pagination from '../../../../components/ui/pagination/Pagination.tsx';
import type { Application } from '../../../../types/application.types.ts';
import type { PaginationResult } from '../../../../types/internship.types.ts';

interface Props {
    pagination: PaginationResult<Application>;
    handlePageChange: (newPage: number) => void;
}

export const ApplicationPagination = ({ pagination, handlePageChange }: Props) => {
    if (!pagination) return null;

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
