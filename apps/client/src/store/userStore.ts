import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type authStore = {
    user: { id: string; role: string[] } | null;
    set: (id:string,role:string[]) => void
    logout: () => void;
};
export const userStore = create<authStore>()(
    persist(
        (set) => ({
            user: null,
            set:  (id:string,role:string[]) => set({user:{id,role}}),
            logout: () => set({user:null})
        }),
        { name: 'auth-storage' },
    ),
);
