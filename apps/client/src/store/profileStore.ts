import { create } from 'zustand';
import type { companyProfile } from '../types';
export type companyProfileStoreType = {
    profile: companyProfile | null;
    setProfil: (profile: companyProfile | null) => void;
    updateProfil: (profile: Partial<companyProfile>) => void;
};

export const profileStore = create<companyProfileStoreType>()((set, get) => ({
    profile: null,
    setProfil: (profile) => set({ profile }),
    updateProfil: (profileUpdate) => {
        const currentProfile = get().profile;
        if (!currentProfile) return; // si profile est null, on ne fait rien
        set({
            profile: {
                ...currentProfile,
                ...profileUpdate,
            },
        });
    },
}));
