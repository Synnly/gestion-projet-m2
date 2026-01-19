import { create } from 'zustand';
import type { PostType } from '../types/internship.types.ts';

export interface CreatePostState {
    title: string;
    description: string;
    adress: string;
    duration: string;
    sector: string;
    startDate: string;
    minSalary?: number;
    maxSalary?: number;
    isVisibleToStudents: boolean;
    type: PostType;
    skills: string[];
    isCoverLetterRequired: boolean;
    setAdress(value: string): void;
    setSkills: (skills: string[]) => void;
    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
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
    adress: '',
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
    setAdress: (value: string) => set({ adress: value }),
    setDuration: (value: string) => set({ duration: value }),
    setSector: (value: string) => set({ sector: value }),
    setStartDate: (value: string) => set({ startDate: value }),
    setMinSalary: (value?: number) => set({ minSalary: value }),
    setMaxSalary: (value?: number) => set({ maxSalary: value }),
    setIsVisibleToStudents: (value: boolean) => set({ isVisibleToStudents: value }),
    setIsCoverLetterRequired: (value: boolean) => set({ isCoverLetterRequired: value }),
    addSkill: (skill) =>
        set((state) => {
            const trimmed = skill.trim();
            if (!trimmed) return state;
            if (state.skills.includes(trimmed)) return state;
            if (state.skills.length >= 5) return state;
            return { skills: [...state.skills, trimmed] };
        }),
    removeSkill: (skill) =>
        set((state) => ({
            skills: state.skills.filter((s) => s !== skill),
        })),
    setPostType: (type: PostType) => set({ type: type }),
    reset: () =>
        set({
            title: '',
            description: '',
            adress: '',
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
