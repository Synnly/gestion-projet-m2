import { useQuery } from '@tanstack/react-query';
import { userStore } from '../store/userStore';
import type { companyProfile } from '../types';
import { UseAuthFetch } from './useAuthFetch';

/**
 * Hook pour récupérer le profil complet d'une company depuis l'API
 * @param companyId - L'ID de la company à récupérer
 */
export const useGetCompanyProfile = (companyId: string) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const access = userStore((state) => state.access);
    const authFetch = UseAuthFetch();
    return useQuery({
        queryKey: ['company-profile', companyId],
        queryFn: async (): Promise<companyProfile> => {
            const response = await authFetch(`${API_URL}/api/companies/${companyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch company profile');
            }

            return response.json();
        },
        enabled: !!companyId && !!access,
    });
};
