export const ExportStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    FAILED: 'failed',
};

export const ExportFormat = {
    JSON: 'json',
};

export const ImportStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    FAILED: 'failed',
};

export type ExportStatus = (typeof ExportStatus)[keyof typeof ExportStatus];

export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];

export interface CreateExportDto {
    format?: ExportFormat;
}

export interface ExportInitiatedResponse {
    message: string;
    exportId: string;
    status: ExportStatus;
}

export interface ExportStatusResponse {
    exportId: string;
    status: ExportStatus;
    fileUrl?: string;
    fileSize?: number;
    collectionsCount?: number;
    documentsCount?: number;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
}

export interface ExportCancelledResponse {
    message: string;
    exportId: string;
}

// Import types
export interface CreateImportDto {
    clearExisting?: boolean;
}

export interface ImportInitiatedResponse {
    message: string;
    importId: string;
    status: ImportStatus;
}

export interface ImportStatusResponse {
    importId: string;
    status: ImportStatus;
    filename?: string;
    fileSize?: number;
    collectionsCount?: number;
    documentsCount?: number;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
}

export interface ImportCancelledResponse {
    message: string;
    importId: string;
}
