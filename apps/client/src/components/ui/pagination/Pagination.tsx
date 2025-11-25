import React from 'react';

interface Props {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    maxButtons?: number;
    className?: string;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const Pagination: React.FC<Props> = ({ page, totalPages, onPageChange, maxButtons = 5, className = '' }) => {
    if (totalPages <= 1) return null;

    const half = Math.floor(maxButtons / 2);
    let start = clamp(page - half, 1, Math.max(1, totalPages - maxButtons + 1));
    let end = Math.min(totalPages, start + maxButtons - 1);

    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <nav className={`flex items-center justify-center gap-2 py-3 ${className}`} aria-label="Pagination">
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => onPageChange(1)}
                disabled={page === 1}
                aria-label="First page"
            >
                «
            </button>
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
            >
                ‹
            </button>

            {pages[0] > 1 && (
                <button className="btn btn-ghost btn-sm" onClick={() => onPageChange(1)}>
                    1
                </button>
            )}
            {pages[0] > 2 && <span className="px-2">…</span>}

            {pages.map((p) => (
                <button
                    key={p}
                    className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => onPageChange(p)}
                    aria-current={p === page ? 'page' : undefined}
                >
                    {p}
                </button>
            ))}

            {pages[pages.length - 1] < totalPages - 1 && <span className="px-2">…</span>}
            {pages[pages.length - 1] < totalPages && (
                <button className="btn btn-ghost btn-sm" onClick={() => onPageChange(totalPages)}>
                    {totalPages}
                </button>
            )}

            <button
                className="btn btn-ghost btn-sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
            >
                ›
            </button>
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages}
                aria-label="Last page"
            >
                »
            </button>
        </nav>
    );
};

export default Pagination;
