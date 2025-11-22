import { create } from 'zustand';
import type { InternShip, InternShipFilters, PaginationResult } from '../types/internship.types';

interface InternShipStore {
    // État
    internships: InternShip[];
    pagination: Omit<PaginationResult<InternShip>, 'data'> | null;
    filters: InternShipFilters;
    selectedInternshipId: string | null;
    savedInternships: string[];
    // UI: height of the InternshipDetail content in pixels when it fits viewport, else null
    detailHeight: number | null;

    // Actions
    setInternships: (data: PaginationResult<InternShip>) => void;
    setFilters: (filters: Partial<InternShipFilters>) => void;
    resetFilters: () => void;
    setSelectedInternshipId: (id: string | null) => void;
    toggleSaveInternship: (id: string) => void;
    clearInternships: () => void;
    setDetailHeight: (h: number | null) => void;
}

const DEFAULT_FILTERS: InternShipFilters = {
    page: 1,
    limit: 10,
};

export const useInternShipStore = create<InternShipStore>((set) => ({
    // État initial
    internships: [],
    pagination: null,
    filters: DEFAULT_FILTERS,
    selectedInternshipId: null,
    savedInternships: [],
    detailHeight: null,

    // Actions
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
            selectedInternshipId: data.data.length > 0 ? data.data[0]._id : null,
        }),

    setFilters: (newFilters) =>
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        })),

    resetFilters: () => set({ filters: DEFAULT_FILTERS }),

    setSelectedInternshipId: (id) => set({ selectedInternshipId: id }),

    toggleSaveInternship: (id) =>
        set((state) => ({
            savedInternships: state.savedInternships.includes(id)
                ? state.savedInternships.filter((internshipId) => internshipId !== id)
                : [...state.savedInternships, id],
        })),

    clearInternships: () =>
        set({
            internships: [],
            pagination: null,
        }),
    setDetailHeight: (h: number | null) => set({ detailHeight: h }),
}));
