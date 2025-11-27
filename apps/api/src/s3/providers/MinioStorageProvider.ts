import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageProvider } from '../interfaces/IStorageProvider';
import * as Minio from 'minio';
import { URL_EXPIRY, PATH_REGEX } from '../s3.constants';

/**
 * MinIO-based implementation of the `IStorageProvider` interface.
 *
 * This class is responsible for interacting with a MinIO server (S3-compatible)
 * to generate presigned URLs, check existence, and delete objects. It also
 * performs basic safety checks (path validation) and ownership verification
 * using object metadata when available.
 */

@Injectable()
export class MinioStorageProvider implements IStorageProvider {
    private minioClient: Minio.Client;
    private bucket: string;

    /**
     * Create a new MinioStorageProvider.
     *
     * The constructor reads connection information from the provided
     * `ConfigService` and initializes a `Minio.Client`. It will throw an
     * `Error` when required configuration values are missing or invalid.
     *
     * @param configService - ConfigService used to read MinIO connection
     *   details from environment variables.
     */
    constructor(private readonly configService: ConfigService) {
        const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
        const port = parseInt(this.configService.get<string>('MINIO_PORT') || '443');
        const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
        const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
        const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');

        this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'uploads';

        if (!endpoint || !accessKey || !secretKey || !this.bucket || isNaN(port)) {
            throw new Error('Missing MinIO configuration in environment variables');
        }

        this.minioClient = new Minio.Client({
            endPoint: endpoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
    }

    /**
     * Generate a presigned URL allowing a client to upload a file.
     *
     * The stored filename is derived as `<userId>_<fileType>.<extension>`.
     * If MinIO fails to produce a presigned URL an Error is thrown.
     *
     * @returns An object containing the resolved `fileName` and the
     *   `uploadUrl` clients can PUT to.
     */
    async generatePresignedUploadUrl(originalFilename: string, fileType: 'logo' | 'cv', userId: string) {
        const extension = originalFilename.split('.').pop()?.toLowerCase() || '';
        const fileName = `${userId}_${fileType}.${extension}`;

        try {
            const uploadUrl = await this.minioClient.presignedPutObject(this.bucket, fileName, URL_EXPIRY.UPLOAD);
            return { fileName, uploadUrl };
        } catch (err) {
            throw new Error('Failed to generate upload URL');
        }
    }

    /**
     * Generate a presigned download URL for a (private) file.
     *
     * Behaviour:
     * - Validates `fileName` against a safe path regex to prevent traversal.
     * - Ensures the file exists (throws `NotFoundException` if missing).
     * - If object metadata contains an `uploaderid`, verifies that it matches
     *   the requesting `userId` and throws `ForbiddenException` otherwise.
     * - Returns a presigned GET URL when checks pass.
     *
     * @param fileName - Storage key / filename to generate the URL for.
     * @param userId - Requesting user's id used for ownership checks.
     * @throws NotFoundException | ForbiddenException | Error
     */
    async generatePresignedDownloadUrl(fileName: string, userId: string) {
        // Validate path to prevent traversal
        if (!PATH_REGEX.SAFE_PATH.test(fileName)) {
            throw new Error('Invalid file path');
        }

        // Check if file exists
        const exists = await this.fileExists(fileName);
        if (!exists) {
            throw new NotFoundException('File not found');
        }

        // Check ownership
        try {
            const stat = await this.minioClient.statObject(this.bucket, fileName);
            const uploaderId = stat.metaData?.uploaderid;

            // If uploaderId exists in metadata, verify ownership
            if (uploaderId && uploaderId !== userId) {
                throw new ForbiddenException('You do not have permission to access this file');
            }
        } catch (err) {
            if (err instanceof ForbiddenException || err instanceof NotFoundException) {
                throw err;
            }
            // If stat fails for other reasons, file might not exist
            throw new NotFoundException('File not found');
        }

        try {
            const downloadUrl = await this.minioClient.presignedGetObject(this.bucket, fileName, URL_EXPIRY.DOWNLOAD);
            return { downloadUrl };
        } catch (err) {
            throw new Error('Failed to generate download URL');
        }
    }

    /**
     * Generate a presigned GET URL for a file without any ownership checks.
     * Useful for public files or when access control is handled elsewhere.
     */
    async generatePublicDownloadUrl(fileName: string) {
        const downloadUrl = await this.minioClient.presignedGetObject(this.bucket, fileName, URL_EXPIRY.DOWNLOAD);
        return { downloadUrl };
    }

    /**
     * Delete a file after validating path safety and ownership (when
     * metadata is present). Throws `NotFoundException` if the file does not
     * exist and `ForbiddenException` when the requesting user is not the
     * uploader according to object metadata.
     *
     * @param fileName - Storage key / filename to delete.
     * @param userId - Requesting user's id used for ownership checks.
     */
    async deleteFile(fileName: string, userId: string): Promise<void> {
        // Validate path to prevent traversal
        if (!PATH_REGEX.SAFE_PATH.test(fileName)) {
            throw new Error('Invalid file path');
        }

        // Check if file exists
        const exists = await this.fileExists(fileName);
        if (!exists) {
            throw new NotFoundException('File not found');
        }

        // Check ownership
        try {
            const stat = await this.minioClient.statObject(this.bucket, fileName);
            const uploaderId = stat.metaData?.uploaderid;

            // If uploaderId exists in metadata, verify ownership
            if (uploaderId && uploaderId !== userId) {
                throw new ForbiddenException('You do not have permission to delete this file');
            }
        } catch (err) {
            if (err instanceof ForbiddenException || err instanceof NotFoundException) {
                throw err;
            }
            // If stat fails for other reasons, file might not exist
            throw new NotFoundException('File not found');
        }

        await this.minioClient.removeObject(this.bucket, fileName);
    }

    /**
     * Check whether an object exists by calling `statObject` on the MinIO
     * client. Returns `true` when the object can be stat'd and `false` on
     * any error (object not found or permission errors).
     *
     * @param fileName - Storage key / filename to check.
     */
    async fileExists(fileName: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(this.bucket, fileName);
            return true;
        } catch {
            return false;
        }
    }
}
