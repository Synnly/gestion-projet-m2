import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type authStore = {
    //set access token
    set: (access: string) => void;
    //extrect user info from access token
    get: (access: string) => { id: string; role: string; isVerified: boolean; isValid: boolean };
    //access token
    access?: string | null;
    //logout user
    logout: () => void;
};
type accessPayload = {
    sub: string;
    role: 'COMPANY' | 'ADMIN' | 'USER';
    email: string;
    rti: string;
    isVerified: boolean;
    isValid: boolean;
};
export const userStore = create<authStore>()(
    persist(
        (set) => ({
            access: null,
            get: (access: string) => {
                const accessPayload: accessPayload = JSON.parse(atob(access.split('.')[1]));
                return {
                    id: accessPayload.sub,
                    role: accessPayload.role,
                    isVerified: accessPayload.isVerified || false,
                    isValid: accessPayload.isValid || true,
                };
            },
            set: (access: string) => set({ access: access }),
            logout: () => set({ access: null }),
        }),
        { name: 'auth-storage' },
    ),
);
