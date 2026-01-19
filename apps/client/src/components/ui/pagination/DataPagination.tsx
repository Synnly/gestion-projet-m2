import type { PaginationResult } from '../../../types/internship.types.ts';
import { cn } from '../../../utils/cn.tsx';
import Pagination from './Pagination.tsx';

interface Props<T> {
    pagination: PaginationResult<T> | undefined;
    handlePageChange: (newPage: number) => void;
    isPreviousData?: boolean;
}

export const DataPagination = <T extends unknown>({ pagination, handlePageChange, isPreviousData }: Props<T>) => {
    return (
        <div
            className={cn(
                'flex flex-col items-center w-full mt-4',
                isPreviousData ? 'opacity-50 pointer-events-none' : '',
            )}
        >
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
