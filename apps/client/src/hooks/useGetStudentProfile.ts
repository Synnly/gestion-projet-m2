import { useQuery } from '@tanstack/react-query';
import { userStore } from '../store/userStore';
import { UseAuthFetch } from './useAuthFetch';
import type { studentProfile } from '../types/student.types.ts';

/**
 * Hook pour récupérer le profil complet d'un étudiant depuis l'API
 * @param studentId - L'ID de l'étudiant à récupérer
 */
export const useGetStudentProfile = (studentId: string) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const access = userStore((state) => state.access);
    const authFetch = UseAuthFetch();
    return useQuery({
        queryKey: ['student-profile', studentId],
        queryFn: async (): Promise<studentProfile> => {
            const response = await authFetch(`${API_URL}/api/students/${studentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch student profile');
            }

            return response.json();
        },
        enabled: !!studentId && !!access,
    });
};
