import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Internship, InternshipFilters, PaginationResult } from '../types/internship.types';

export interface InternshipStore {
    // État
    internships: Internship[];
    pagination: Omit<PaginationResult<Internship>, 'data'> | null;
    filters: InternshipFilters;
    selectedInternshipId: string | null;
    savedInternships: string[];
    // UI: height of the InternshipDetail content in pixels when it fits viewport, else null
    detailHeight: number | null;
    // Callback pour refetch les données quand les filtres changent
    refetchCallback: (() => void) | null;

    // Actions
    setInternships: (data: PaginationResult<Internship>) => void;
    setFilters: (filters: Partial<InternshipFilters>) => void;
    resetFilters: () => void;
    setSelectedInternshipId: (id: string | null) => void;
    toggleSaveInternship: (id: string) => void;
    clearInternships: () => void;
    removeInternshipsByIds: (ids: string[]) => void;
    setDetailHeight: (h: number | null) => void;
    setRefetchCallback: (callback: (() => void) | null) => void;
}

const DEFAULT_FILTERS: InternshipFilters = {
    page: 1,
    limit: 10,
};

export const useInternshipStore = create<InternshipStore>()(
    persist(
        (set, get) => ({
            // État initial
            internships: [],
            pagination: null,
            filters: DEFAULT_FILTERS,
            selectedInternshipId: null,
            savedInternships: [],
            detailHeight: null,
            refetchCallback: null,

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

            setFilters: (newFilters) => {
                set((state) => ({
                    filters: { ...state.filters, ...newFilters },
                }));
                // Appel automatique du refetch si une callback est enregistrée
                const callback = get().refetchCallback;
                if (callback) {
                    callback();
                }
            },

            resetFilters: () => {
                set({ filters: DEFAULT_FILTERS });
                // Appel automatique du refetch si une callback est enregistrée
                const callback = get().refetchCallback;
                if (callback) {
                    callback();
                }
            },

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
            removeInternshipsByIds: (ids: string[]) =>
                set((state) => ({
                    internships: state.internships.filter((i) => !ids.includes(i._id)),
                    pagination: state.pagination,
                })),
            setDetailHeight: (h: number | null) => set({ detailHeight: h }),
            setRefetchCallback: (callback: (() => void) | null) => set({ refetchCallback: callback }),
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
