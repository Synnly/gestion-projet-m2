import { useQuery } from '@tanstack/react-query';
import { userStore } from '../store/userStore';
import type { companyProfile } from '../types';

/**
 * Hook pour récupérer le profil complet d'une company depuis l'API
 * @param companyId - L'ID de la company à récupérer
 */
export const useGetCompanyProfile = (companyId: string) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const access = userStore((state) => state.access);

    return useQuery({
        queryKey: ['company-profile', companyId],
        queryFn: async (): Promise<companyProfile> => {
            const response = await fetch(`${API_URL}/api/companies/${companyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch company profile');
            }

            return response.json();
        },
        enabled: !!companyId && !!access,
    });
};
