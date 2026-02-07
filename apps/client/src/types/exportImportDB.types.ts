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

export type ExportStatus = (typeof ExportStatus)[keyof typeof ExportStatus];

export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

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

export interface ExportListItem {
    exportId: string;
    status: ExportStatus;
    fileUrl?: string;
    fileSize?: number;
    collectionsCount?: number;
    documentsCount?: number;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
}

export interface ExportCancelledResponse {
    message: string;
    exportId: string;
}
