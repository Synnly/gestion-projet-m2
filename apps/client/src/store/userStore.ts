import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type userPayload = { id: string; mail: string; role: string; isVerified: boolean; isValid: boolean };

type authStore = {
    //set access token
    set: (access: string) => void;
    //extrect user info from access token
    get: (access: string) => userPayload;
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
                    mail: accessPayload.email,
                    role: accessPayload.role,
                    isVerified: accessPayload.isVerified,
                    isValid: accessPayload.isValid,
                };
            },
            set: (access: string) => set({ access: access }),
            logout: () => set({ access: null }),
        }),
        { name: 'auth-storage' },
    ),
);
