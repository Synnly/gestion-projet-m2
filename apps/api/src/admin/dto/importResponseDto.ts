import { ImportStatus } from '../database-import.schema';

/**
 * Response DTO when an import is initiated
 */
export class ImportInitiatedResponseDto {
    message: string;
    importId: string;
    status: ImportStatus;
}

/**
 * Response DTO for import status queries
 */
export class ImportStatusResponseDto {
    importId: string;
    status: ImportStatus;
    filename?: string;
    fileSize?: number;
    collectionsCount?: number;
    documentsCount?: number;
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
}

/**
 * Response DTO when an import is cancelled
 */
export class ImportCancelledResponseDto {
    message: string;
    importId: string;
}
