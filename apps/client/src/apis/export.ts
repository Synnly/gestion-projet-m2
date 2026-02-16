import { UseAuthFetch } from '../hooks/useAuthFetch';
import type {
    CreateExportDto,
    ExportCancelledResponse,
    ExportInitiatedResponse,
    ExportStatusResponse,
} from '../types/exportImportDB.types';
const API_URL = import.meta.env.VITE_APIURL;

/**
 * Initiate a new database export
 * @param authFetch Authenticated fetch function
 * @param dto Export configuration
 * @returns Export initiation response
 */
export const createExport = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    dto: CreateExportDto = {},
): Promise<ExportInitiatedResponse> => {
    const response = await authFetch(`${API_URL}/api/admin/export`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error("Erreur lors de l'initiation de l'export");
    }

    return response.json();
};

/**
 * Get the status of a specific export
 * @param authFetch Authenticated fetch function
 * @param exportId ID of the export
 * @returns Export status details
 */
export const getExportStatus = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    exportId: string,
): Promise<ExportStatusResponse> => {
    const response = await authFetch(`${API_URL}/api/admin/export/${exportId}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la récupération du statut de l'export");
    }

    return response.json();
};

/**
 * Cancel an ongoing export
 * @param authFetch Authenticated fetch function
 * @param exportId ID of the export to cancel
 * @returns Cancellation confirmation
 */
export const cancelExport = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    exportId: string,
): Promise<ExportCancelledResponse> => {
    const response = await authFetch(`${API_URL}/api/admin/export/${exportId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error("Erreur lors de l'annulation de l'export");
    }

    return response.json();
};

/**
 * Download a completed export file
 * The API streams the file directly from the server (stored in ./exports directory)
 * @param authFetch Authenticated fetch function
 * @param exportId ID of the export to download
 */
export const downloadExport = async (authFetch: ReturnType<typeof UseAuthFetch>, exportId: string): Promise<void> => {
    const response = await authFetch(`${API_URL}/api/admin/export/${exportId}/download`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error("Erreur lors du téléchargement de l'export");
    }

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `export-${exportId}.json.gz`;

    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
            filename = filenameMatch[1];
        }
    }

    // Convert response to blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
