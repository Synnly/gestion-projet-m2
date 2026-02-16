import { ExportStatus } from '../database-export.schema';

/**
 * DTO for export initiation response.
 */
export class ExportInitiatedResponseDto {
    /** Success message */
    message: string;

    /** ID of the created export job */
    exportId: string;

    /** Current status of the export */
    status: ExportStatus;
}

/**
 * DTO for export status response.
 */
export class ExportStatusResponseDto {
    /** ID of the export */
    exportId: string;

    /** Current status of the export */
    status: ExportStatus;

    /** URL to download the export file */
    fileUrl?: string;

    /** Size of the export file in bytes */
    fileSize?: number;

    /** Number of collections exported */
    collectionsCount?: number;

    /** Total number of documents exported */
    documentsCount?: number;

    /** Timestamp when the export started */
    startedAt?: Date;

    /** Timestamp when the export completed */
    completedAt?: Date;

    /** Error message if the export failed */
    errorMessage?: string;
}

/**
 * DTO for export cancellation response.
 */
export class ExportCancelledResponseDto {
    /** Success message */
    message: string;

    /** ID of the cancelled export */
    exportId: string;
}
