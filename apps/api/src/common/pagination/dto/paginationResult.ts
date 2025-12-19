/**
 * Result returned by pagination helpers.
 *
 * Contains the items for the current page together with useful metadata
 * such as total item count, current page and whether next/previous pages
 * are available.
 */
export interface PaginationResult<T> {
    /** Items for the current page */
    data: T[];

    /** Current page number (1-based) */
    page: number;

    /** Number of items per page */
    limit: number;

    /** Total number of items matching the filter */
    total: number;

    /** Total number of pages */
    totalPages: number;

    /** True if there is a next page */
    hasNext: boolean;

    /** True if there is a previous page */
    hasPrev: boolean;
}
