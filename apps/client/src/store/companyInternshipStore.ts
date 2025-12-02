import { create } from 'zustand';
import type { Internship, InternshipFilters, PaginationResult } from '../types/internship.types';
export interface companyInternshipStore {
    internships: Internship[];
    pagination: Omit<PaginationResult<Internship>, 'data'> | null;
    setInternships: (data: PaginationResult<Internship>) => void;
    filters: InternshipFilters;
    resetFilters: () => void;
    setFilters: (filters: Partial<InternshipFilters>) => void;
    clearInternships: () => void;
}

const DEFAULT_FILTERS: InternshipFilters = {
    page: 1,
    limit: 10,
};

export const companyPostStore = create<companyInternshipStore>()((set) => ({
    // État initial
    internships: [],
    pagination: null,
    filters: DEFAULT_FILTERS,
    setInternships: (data) =>
        set({
            internships: data.data,
            pagination: {
                total: data.total,
                page: data.page,
                limit: data.limit,
                totalPages: data.totalPages,
                hasNext: data.hasNext,
                hasPrev: data.hasPrev,
            },
        }),
    resetFilters: () => set({ filters: DEFAULT_FILTERS }),

    setFilters: (newFilters) =>
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        })),

    clearInternships: () =>
        set({
            internships: [],
            pagination: null,
        }),
}));
