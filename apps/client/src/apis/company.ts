import { UseAuthFetch } from '../hooks/useAuthFetch';
import type { companyProfile } from '../types/CompanyProfile.types.ts';

const API_URL = import.meta.env.VITE_APIURL;

export interface PaginatedCompanyResponse {
    data: companyProfile[];
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

export const validateCompany = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    companyId: string,
    rejectionReason?: string,
): Promise<void> => {
    const response = await authFetch(`${API_URL}/api/companies/${companyId}/validate`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            rejectionReason: rejectionReason || undefined,
        }),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la validation');
    }
};

export const rejectCompany = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    companyId: string,
    rejectionReason: string,
): Promise<void> => {
    const response = await authFetch(`${API_URL}/api/companies/${companyId}/reject`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            rejectionReason,
        }),
    });

    if (!response.ok) {
        throw new Error('Erreur lors du rejet');
    }
};

export const deleteCompanyAccount = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    companyId: string,
): Promise<void> => {
    const response = await authFetch(`${API_URL}/api/companies/${companyId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la suppression du compte');
    }
};

export const restoreCompanyAccount = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    companyId: string,
): Promise<void> => {
    const response = await authFetch(`${API_URL}/api/companies/${companyId}/restore`, {
        method: 'POST',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la restauration du compte');
    }
};

export interface DeletionStatus {
    isDeleted: boolean;
    daysRemaining?: number;
    deletedAt?: string;
}

export const fetchCompanies = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    page: number = 1,
    limit: number = 10,
): Promise<PaginatedCompanyResponse> => {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    const response = await authFetch(`${API_URL}/api/companies?${queryParams.toString()}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erreur lors du chargement des entreprises');
    }

    return response.json();
};

export const checkDeletionStatus = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    companyId: string,
): Promise<DeletionStatus> => {
    const response = await authFetch(`${API_URL}/api/companies/${companyId}/deletion-status`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la vérification du statut de suppression');
    }

    return response.json();
};

export const deleteCompany = async (authFetch: ReturnType<typeof UseAuthFetch>, companyId: string) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const response = await authFetch(`${API_URL}/api/companies/${companyId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete company');
    }
    return;
};

export const deleteAllCompanies = async (authFetch: ReturnType<typeof UseAuthFetch>) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const response = await authFetch(`${API_URL}/api/companies`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete all companies');
    }

    return;
};
