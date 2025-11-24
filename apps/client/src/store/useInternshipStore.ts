import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Internship, InternshipFilters, PaginationResult } from '../types/internship.types';

interface InternshipStore {
    // État
    internships: Internship[];
    pagination: Omit<PaginationResult<Internship>, 'data'> | null;
    filters: InternshipFilters;
    selectedInternshipId: string | null;
    savedInternships: string[];
    // UI: height of the InternshipDetail content in pixels when it fits viewport, else null
    detailHeight: number | null;

    // Actions
    setInternships: (data: PaginationResult<Internship>) => void;
    setFilters: (filters: Partial<InternshipFilters>) => void;
    resetFilters: () => void;
    setSelectedInternshipId: (id: string | null) => void;
    toggleSaveInternship: (id: string) => void;
    clearInternships: () => void;
    setDetailHeight: (h: number | null) => void;
}

const DEFAULT_FILTERS: InternshipFilters = {
    page: 1,
    limit: 10,
};

export const useInternshipStore = create<InternshipStore>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'internship-storage',
            // Persist only the minimal state we want to keep between reloads
            partialize: (state: InternshipStore) => ({
                savedInternships: state.savedInternships,
                filters: state.filters,
                selectedInternshipId: state.selectedInternshipId,
            }),
        },
    ),
);
