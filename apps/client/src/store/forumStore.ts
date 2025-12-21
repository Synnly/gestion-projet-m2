import { create } from 'zustand';
import type { Forum, ForumFilters } from '../types/forum.types';
import type { PaginationResult } from '../types/internship.types.ts';

export interface ForumStore {
    forums: Forum[];
    filters: ForumFilters;
    setFilters: (filters: Partial<ForumFilters>) => void;
    pagination: Omit<PaginationResult<Forum>, 'data'> | null;
    setForums: (data: PaginationResult<Forum>) => void;
    addForum: (forum: Forum) => void;
    updateForum: (id: string, forum: Partial<Forum>) => void;
    deleteForum: (id: string) => void;
}

const DEFAULT_FILTERS: ForumFilters = {
    page: 1,
    limit: 10,
};

export const forumStore = create<ForumStore>((set) => ({
    forums: [],
    pagination: null,
    filters: DEFAULT_FILTERS,
    setForums: (data) =>
        set({
            forums: data.data,
            pagination: {
                total: data.total,
                page: data.page,
                limit: data.limit,
                totalPages: data.totalPages,
                hasNext: data.hasNext,
                hasPrev: data.hasPrev,
            },
        }),
    addForum: (forum: Forum) => set((state) => ({ forums: [...state.forums, forum] })),
    updateForum: (id: string, updatedForum: Partial<Forum>) =>
        set((state) => ({
            forums: state.forums.map((forum) => (forum._id === id ? { ...forum, ...updatedForum } : forum)),
        })),
    deleteForum: (id) =>
        set((state) => ({
            forums: state.forums.filter((forum) => forum._id !== id),
        })),
    setFilters: (newFilters) =>
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        })),
}));
