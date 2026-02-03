import type { Application } from '../../../types/application.types';
import type { PaginationResult } from '../../../types/internship.types';
import Pagination from '../../common/ui/pagination/Pagination';

interface Props {
    pagination: PaginationResult<Application> | undefined;
    handlePageChange: (newPage: number) => void;
}

export const ApplicationPagination = ({ pagination, handlePageChange }: Props) => {
    return (
        <div>
            {pagination && (
                <Pagination
                    page={Number(pagination.page)}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    className="!py-0"
                />
            )}
        </div>
    );
};
