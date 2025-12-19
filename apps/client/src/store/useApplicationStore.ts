import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApplicationStatus = 'Pending' | 'Read' | 'Accepted' | 'Rejected';

export interface ApplicationListItem {
    _id: string;
    status: ApplicationStatus | string;
    createdAt: string;
    post: {
        _id: string;
        title: string;
        description?: string;
        duration?: string;
        type?: string;
        adress?: string;
        sector?: string;
        company?: {
            _id: string;
            name: string;
        };
    };
}

export interface ApplicationResponse {
    data: ApplicationListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface ApplicationPagination {
    total: number;
    page: number;
    limit: number;
}

export type ApplicationFilters = {
    page: number;
    limit: number;
    status?: string;
    searchQuery?: string;
};

export type ApplicationStore = {
    applications: ApplicationListItem[];
    pagination: ApplicationPagination | null;
    filters: ApplicationFilters;
    selectedApplicationId: string | null;
    setApplications: (data: ApplicationResponse) => void;
    setFilters: (filters: Partial<ApplicationFilters>) => void;
    setSelectedApplicationId: (id: string | null) => void;
    resetFilters: () => void;
};

const DEFAULT_FILTERS: ApplicationFilters = { page: 1, limit: 5 };

export const useApplicationStore = create<ApplicationStore>()(
    persist(
        (set) => ({
            applications: [],
            pagination: null,
            filters: DEFAULT_FILTERS,
            selectedApplicationId: null,
            setApplications: (data) =>
                set({
                    applications: data.data,
                    pagination: {
                        total: data.total,
                        page: data.page,
                        limit: data.limit,
                    },
                    selectedApplicationId: data.data.length > 0 ? data.data[0]._id : null,
                }),
            setFilters: (newFilters) =>
                set((state) => ({
                    // on merge
                    filters: { ...state.filters, ...newFilters },
                })),
            setSelectedApplicationId: (id) => set({ selectedApplicationId: id }),
            resetFilters: () => set({ filters: DEFAULT_FILTERS }),
        }),
        {
            name: 'application-storage',
            partialize: (state: ApplicationStore) => ({
                filters: state.filters,
                selectedApplicationId: state.selectedApplicationId,
            }),
        },
    ),
);
