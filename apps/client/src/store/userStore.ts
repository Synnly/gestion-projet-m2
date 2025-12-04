import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type userPayload = {
    id: string;
    mail: string;
    role: 'COMPANY' | 'ADMIN' | 'STUDENT';
    isVerified: boolean;
    isValid: boolean;
};

type authStore = {
    //set access token
    set: (access: string) => void;
    //extrect user info from access token; returns null when access is missing or invalid
    get: (access?: string | null) => userPayload | null;
    //access token
    access?: string | null;
    //logout user
    logout: () => void;
};

type accessPayload = {
    sub: string;
    role: 'COMPANY' | 'ADMIN' | 'STUDENT';
    email: string;
    rti: string;
    isVerified: boolean;
    isValid: boolean;
};

export const userStore = create<authStore>()(
    persist(
        (set) => ({
            access: null,
            get: (access?: string | null) => {
                if (!access) return null;
                try {
                    const parts = access.split('.');
                    if (parts.length < 2) return null;
                    const accessPayload: accessPayload = JSON.parse(atob(parts[1]));
                    return {
                        id: accessPayload.sub,
                        mail: accessPayload.email,
                        role: accessPayload.role,
                        // isVerified: accessPayload.isVerified,
                        isVerified:true,
                        isValid: accessPayload.isValid,
                    };
                } catch (e) {
                    // Invalid token format or JSON parse error
                    return null;
                }
            },
            set: (access: string) => set({ access: access }),
            logout: () => set({ access: null }),
        }),
        { name: 'auth-storage' },
    ),
);
