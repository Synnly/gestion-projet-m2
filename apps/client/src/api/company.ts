import { UseAuthFetch } from '../hooks/useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL;

export interface Company {
    _id: string;
    name: string;
    email: string;
    siretNumber?: string;
    city?: string;
    postalCode?: string;
    structureType?: string;
    legalStatus?: string;
    isValid: boolean;
    createdAt: string;
}

export interface PaginatedCompanyResponse {
    data: Company[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export const fetchPendingCompanies = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    page: number = 1,
    limit: number = 10,
    sortOrder: '-1' | '1' = '-1',
): Promise<PaginatedCompanyResponse> => {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortOrder,
    });

    const response = await authFetch(`${API_URL}/api/companies/pending-validation?${queryParams.toString()}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erreur lors du chargement des entreprises');
    }

    return response.json();
};

export const validateCompany = async (authFetch: ReturnType<typeof UseAuthFetch>, companyId: string): Promise<void> => {
    const response = await authFetch(`${API_URL}/api/companies/${companyId}/validate`, {
        method: 'PUT',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la validation');
    }
};

export const rejectCompany = async (authFetch: ReturnType<typeof UseAuthFetch>, companyId: string): Promise<void> => {
    const response = await authFetch(`${API_URL}/api/companies/${companyId}/reject`, {
        method: 'PUT',
    });

    if (!response.ok) {
        throw new Error('Erreur lors du rejet');
    }
};
