import { Injectable, Inject } from '@nestjs/common';
import { STORAGE_PROVIDER } from './s3.constants';
import type { IStorageProvider } from './interfaces/IStorageProvider';

/**
 * High-level S3 service used by application controllers and other services.
 *
 * This service acts as a thin façade that delegates storage operations to the
 * configured `IStorageProvider` implementation (MinIO, AWS, ...). Keeping the
 * service small simplifies testing and allows swapping providers without
 * changing business logic.
 */
@Injectable()
export class S3Service {
    constructor(@Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider) {}

    /**
     * Return a presigned upload URL and the calculated storage filename.
     * Delegates to the configured storage provider.
     */
    generatePresignedUploadUrl(originalFilename: string, fileType: 'logo' | 'cv', userId: string) {
        return this.provider.generatePresignedUploadUrl(originalFilename, fileType, userId);
    }

    /**
     * Return a presigned download URL for a private file. Delegates to the
     * configured storage provider which may perform access checks and throw
     * appropriate exceptions (e.g. NotFound, Forbidden).
     */
    generatePresignedDownloadUrl(fileName: string, userId: string) {
        return this.provider.generatePresignedDownloadUrl(fileName, userId);
    }

    /**
     * Return a presigned download URL for a public file (no ownership checks).
     */
    generatePublicDownloadUrl(fileName: string) {
        return this.provider.generatePublicDownloadUrl(fileName);
    }

    /**
     * Delete a file via the storage provider. The provider may validate path
     * safety and ownership and throw if deletion is not permitted.
     */
    deleteFile(fileName: string, userId: string) {
        return this.provider.deleteFile(fileName, userId);
    }

    /**
     * Check whether a file exists in storage. Delegates to the provider.
     */
    fileExists(fileName: string) {
        return this.provider.fileExists(fileName);
    }
}
