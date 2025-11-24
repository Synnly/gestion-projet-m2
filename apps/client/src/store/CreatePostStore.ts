import { create } from "zustand";

export type WorkMode = "presentiel" | "teletravail" | "hybride";

export interface CreatePostState {
  title: string;
  description: string;
  location: string;
  duration: string;
  sector: string;
  startDate: string;
  minSalary: string;
  maxSalary: string;
  isVisibleToStudents: boolean;
  workMode: WorkMode;
  skills: string[];
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setLocation: (value: string) => void;
  setDuration: (value: string) => void;
  setSector: (value: string) => void;
  setStartDate: (value: string) => void;
  setMinSalary: (value: string) => void;
  setMaxSalary: (value: string) => void;
  setIsVisibleToStudents: (value: boolean) => void;
  setSkills: (skills: string[]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  setWorkMode: (mode: WorkMode) => void;
  reset: () => void;
}

export const useCreatePostStore = create<CreatePostState>((set) => ({
  title: "",
  description: "",
  location: "",
  duration: "",
  sector: "",
  startDate: "",
  minSalary: "",
  maxSalary: "",
  isVisibleToStudents: true,
  workMode: "presentiel",
  skills: [],

  setTitle: (value: string) => set({ title: value }),
  setDescription: (value: string) => set({ description: value }),
  setLocation: (value: string) => set({ location: value }),
  setDuration: (value: string) => set({ duration: value }),
  setSector: (value: string) => set({ sector: value }),
  setStartDate: (value: string) => set({ startDate: value }),
  setMinSalary: (value: string) => set({ minSalary: value }),
  setMaxSalary: (value: string) => set({ maxSalary: value }),
  setIsVisibleToStudents: (value: boolean) =>
    set({ isVisibleToStudents: value }),
  setSkills: (skills: string[]) => set({ skills }),

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
  setWorkMode: (mode: WorkMode) => set({ workMode: mode }),
  reset: () =>
    set({
      title: "",
      description: "",
      location: "",
      duration: "",
      sector: "",
      startDate: "",
      minSalary: "",
      maxSalary: "",
      isVisibleToStudents: true,
      workMode: "presentiel",
      skills: [],
    }),
}));
