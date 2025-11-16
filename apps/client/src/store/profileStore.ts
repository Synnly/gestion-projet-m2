import { create } from 'zustand';
import type { completeProfilFormType } from '../company/completeProfil/type';

type companyProfileStoreType = {
    profile: completeProfilFormType | null;
    setProfil: (profile: completeProfilFormType | null) => void;
};

export const profileStore = create<companyProfileStoreType>()((set) => ({
    profile: null,
    setProfil: (profile) => set({ profile }),
}));
