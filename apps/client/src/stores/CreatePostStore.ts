import { create } from 'zustand';
import type { PostType } from '../types/internship.types.ts';

export interface CreatePostState {
    title: string;
    description: string;
    location: string;
    addressLine: string;
    city: string;
    postalCode: string;
    duration: string;
    sector: string;
    startDate: string;
    minSalary?: number;
    maxSalary?: number;
    isVisibleToStudents: boolean;
    type: PostType;
    skills: string[];
    isCoverLetterRequired: boolean;
    setSkills: (skills: string[]) => void;
    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
    setLocation: (value: string) => void;
    setAddressLine: (value: string) => void;
    setCity: (value: string) => void;
    setPostalCode: (value: string) => void;
    setDuration: (value: string) => void;
    setSector: (value: string) => void;
    setStartDate: (value: string) => void;
    setMinSalary: (value?: number) => void;
    setMaxSalary: (value?: number) => void;
    setIsVisibleToStudents: (value: boolean) => void;
    addSkill: (skill: string) => void;
    removeSkill: (skill: string) => void;
    setPostType: (mode: PostType) => void;
    setIsCoverLetterRequired: (value: boolean) => void;
    reset: () => void;
}

export const useCreatePostStore = create<CreatePostState>((set) => ({
    title: '',
    description: '',
    location: '',
    addressLine: '',
    city: '',
    postalCode: '',
    duration: '',
    sector: '',
    startDate: '',
    isVisibleToStudents: true,
    isCoverLetterRequired: false,
    type: 'Présentiel',
    skills: [],
    setSkills: (skills: string[]) => set({ skills }),

    setTitle: (value: string) => set({ title: value }),
    setDescription: (value: string) => set({ description: value }),
    setLocation: (value: string) => set({ location: value }),
    setAddressLine: (value: string) => set({ addressLine: value }),
    setCity: (value: string) => set({ city: value }),
    setPostalCode: (value: string) => set({ postalCode: value }),
    setDuration: (value: string) => set({ duration: value }),
    setSector: (value: string) => set({ sector: value }),
    setStartDate: (value: string) => set({ startDate: value }),
    setMinSalary: (value?: number) => set({ minSalary: value }),
    setMaxSalary: (value?: number) => set({ maxSalary: value }),
    setIsVisibleToStudents: (value: boolean) => set({ isVisibleToStudents: value }),
    setIsCoverLetterRequired: (value: boolean) => set({ isCoverLetterRequired: value }),
    // Prevent duplicates and cap the skill list to five entries.
    addSkill: (skill) =>
        set((state) => {
            const trimmed = skill.trim();
            if (!trimmed) return state;
            if (state.skills.includes(trimmed)) return state;
            if (state.skills.length >= 5) return state;
            return { skills: [...state.skills, trimmed] };
        }),
    // Remove a skill tag when the user clicks the chip.
    removeSkill: (skill) =>
        set((state) => ({
            skills: state.skills.filter((s) => s !== skill),
        })),
    setPostType: (type: PostType) => set({ type: type }),
    reset: () =>
        set({
            title: '',
            description: '',
            location: '',
            addressLine: '',
            city: '',
            postalCode: '',
            duration: '',
            sector: '',
            startDate: '',
            minSalary: undefined,
            maxSalary: undefined,
            isVisibleToStudents: true,
            type: 'Présentiel',
            skills: [],
        }),
}));
