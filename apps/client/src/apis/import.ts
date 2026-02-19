import { UseAuthFetch } from '../hooks/useAuthFetch';
import type {
    CreateImportDto,
    ImportCancelledResponse,
    ImportInitiatedResponse,
    ImportStatusResponse,
} from '../types/exportImportDB.types';

const API_URL = import.meta.env.VITE_APIURL;

/**
 * Initiate a new database import with file upload
 * @param authFetch Authenticated fetch function
 * @param file The file to upload (.json.gz or .json)
 * @param dto Import configuration
 * @returns Import initiation response
 */
export const createImport = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    file: File,
    dto: CreateImportDto = {},
): Promise<ImportInitiatedResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clearExisting', dto.clearExisting?.toString() || 'false');

    const response = await authFetch(`${API_URL}/api/admin/import`, {
        method: 'POST',
        data: formData,
    });

    if (!response.ok) {
        let errorMessage = "Erreur lors de l'initiation de l'import";
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
        }
        throw new Error(errorMessage);
    }

    return response.json();
};

/**
 * Get the status of a specific import
 * @param authFetch Authenticated fetch function
 * @param importId ID of the import
 * @returns Import status details
 */
export const getImportStatus = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    importId: string,
): Promise<ImportStatusResponse> => {
    const response = await authFetch(`${API_URL}/api/admin/import/${importId}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la récupération du statut de l'import");
    }

    return response.json();
};

/**
 * Cancel an ongoing import
 * @param authFetch Authenticated fetch function
 * @param importId ID of the import to cancel
 * @returns Cancellation confirmation
 */
export const cancelImport = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    importId: string,
): Promise<ImportCancelledResponse> => {
    const response = await authFetch(`${API_URL}/api/admin/import/${importId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error("Erreur lors de l'annulation de l'import");
    }

    return response.json();
};
