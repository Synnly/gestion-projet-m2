import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type authStore = {
    user: { access: string; role: string; isVerified: boolean } | null;
    set: (access: string, role: string, isVerified: boolean) => void;
    logout: () => void;
};
export const userStore = create<authStore>()(
    persist(
        (set) => ({
            user: null,
            set: (access: string, role: string, isVerified: boolean) => set({ user: { access, role, isVerified } }),
            logout: () => set({ user: null }),
        }),
        { name: 'auth-storage' },
    ),
);
