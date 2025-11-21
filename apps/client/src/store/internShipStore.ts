import { create } from 'zustand';
import { mockJobs, type Job } from '../modules/intershipList/data';

interface JobStore {
  selectedJobId: string | null;
  searchQuery: string;
  savedJobs: string[];
  setSelectedJobId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  toggleSaveJob: (id: string) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  selectedJobId: '2',
  searchQuery: '',
  savedJobs: ['2'],
  setSelectedJobId: (id) => set({ selectedJobId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleSaveJob: (id) => set((state) => ({
    savedJobs: state.savedJobs.includes(id)
      ? state.savedJobs.filter(jobId => jobId !== id)
      : [...state.savedJobs, id]
  }))
}));

export const fetchJobs = async (): Promise<Job[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockJobs), 500);
  });
};