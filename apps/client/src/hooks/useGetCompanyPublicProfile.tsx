import { useQuery } from '@tanstack/react-query';
import { userStore } from '../stores/userStore';
import { UseAuthFetch } from './useAuthFetch';

export type PublicCompanyProfile = {
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    telephone?: string;
    website?: string;
    emailContact?: string;
    streetNumber?: string;
    streetName?: string;
    postalCode?: string;
    city?: string;
    country?: string;
};

export const useGetCompanyPublicProfile = (companyId?: string) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const access = userStore((state) => state.access);
    const authFetch = UseAuthFetch();

    return useQuery({
        queryKey: ['company-public-profile', companyId],
        queryFn: async (): Promise<PublicCompanyProfile> => {
            const response = await authFetch(`${API_URL}/api/companies/${companyId}/public-profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch public company profile');
            }

            return response.json();
        },
        enabled: !!companyId && !!access,
    });
};
