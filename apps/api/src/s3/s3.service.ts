import {
    Injectable,
    OnModuleInit,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { BUCKET_PREFIXES, URL_EXPIRY, PATH_REGEX } from './s3.constants';
import { InvalidConfigurationException } from '../common/exceptions/invalidConfiguration.exception';

export interface PresignedUploadResult {
    fileName: string;
    uploadUrl: string;
}

export interface PresignedDownloadResult {
    downloadUrl: string;
}

export interface FileMetadata {
    filename: string;
    contentType: string;
    size: number;
    uploadedAt: string;
    uploaderId: string;
}

/**
 * S3Service - Simplified version for presigned URLs only
 *
 * Handles:
 * - Generating presigned PUT URLs for uploads (logos & CVs)
 * - Generating presigned GET URLs for downloads
 * - File deletion with ownership verification
 */
@Injectable()
export class S3Service implements OnModuleInit {
    private minioClient: Minio.Client;
    private bucket: string;

    constructor(private readonly configService: ConfigService) {}

    /**
     * Initialize MinIO client and ensure bucket exists
     */
    async onModuleInit(): Promise<void> {
        await this.initializeMinioClient();
        await this.ensureBucketExists();
    }

    /**
     * Initialize MinIO client from environment variables
     */
    private async initializeMinioClient(): Promise<void> {
        const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
        const port = parseInt(this.configService.get<string>('MINIO_PORT') || '443');
        const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
        const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
        const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
        Logger.log(endpoint);
        Logger.log(accessKey);
        Logger.log(secretKey);
        if (!endpoint || !accessKey || !secretKey) {
            throw new InvalidConfigurationException(
                'MinIO configuration incomplete. Check MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY',
            );
        }

        this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'uploads';

        this.minioClient = new Minio.Client({
            endPoint: endpoint,
            port,
            useSSL,
            accessKey,
            secretKey,
        });
    }

    /**
     * Ensure the bucket exists, create if needed
     */
    private async ensureBucketExists(): Promise<void> {
        try {
            const exists = await this.minioClient.bucketExists(this.bucket);

            if (!exists) {
                await this.minioClient.makeBucket(this.bucket, '');
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate a presigned PUT URL for file upload
     * @param originalFilename Original filename from client
     * @param fileType 'logo' or 'cv'
     * @param userId ID of the user uploading (for ownership tracking)
     * @returns Object containing the generated fileName and uploadUrl
     */
    async generatePresignedUploadUrl(
        originalFilename: string,
        fileType: 'logo' | 'cv',
        userId: string,
    ): Promise<PresignedUploadResult> {
        // Extract extension from original filename
        const extension = originalFilename.split('.').pop()?.toLowerCase() || '';

        // Generate filename: userId_logo.ext or userId_cv.ext (no folder prefix)
        const fileName = `${userId}_${fileType}.${extension}`;

        // Validate path
        if (!PATH_REGEX.SAFE_PATH.test(fileName)) {
            throw new BadRequestException('Invalid file path generated');
        }

        // Check if file already exists and delete it (overwrite old version)
        const exists = await this.fileExists(fileName);
        if (exists) {
            try {
                await this.minioClient.removeObject(this.bucket, fileName);
            } catch (error) {
                // Continue even if deletion fails
            }
        }

        try {
            // Generate presigned PUT URL with metadata
            const uploadUrl = await this.minioClient.presignedPutObject(this.bucket, fileName, URL_EXPIRY.UPLOAD);

            return {
                fileName,
                uploadUrl,
            };
        } catch (error) {
            throw new InternalServerErrorException('Failed to generate upload URL');
        }
    }

    /**
     * Generate a presigned GET URL for file download
     * @param fileName Full path of the file in the bucket
     * @param userId ID of the user requesting download (for ownership verification)
     * @returns Object containing the downloadUrl
     */
    async generatePresignedDownloadUrl(fileName: string, userId: string): Promise<PresignedDownloadResult> {
        // Validate path to prevent traversal
        if (!PATH_REGEX.SAFE_PATH.test(fileName)) {
            throw new BadRequestException('Invalid file path');
        }

        // Check if file exists
        const exists = await this.fileExists(fileName);
        if (!exists) {
            throw new NotFoundException(`File not found: ${fileName}`);
        }

        // TODO: Verify ownership - check if userId matches file metadata
        // For now, we'll implement basic verification
        await this.verifyOwnership(fileName, userId);

        try {
            const downloadUrl = await this.minioClient.presignedGetObject(this.bucket, fileName, URL_EXPIRY.DOWNLOAD);
            return { downloadUrl };
        } catch (error) {
            throw new InternalServerErrorException('Failed to generate download URL');
        }
    }

    /**
     * Delete a file from storage
     * @param fileName Full path of the file in the bucket
     * @param userId ID of the user requesting deletion (for ownership verification)
     */
    async deleteFile(fileName: string, userId: string): Promise<void> {
        // Validate path
        if (!PATH_REGEX.SAFE_PATH.test(fileName)) {
            throw new BadRequestException('Invalid file path');
        }

        // Check if file exists
        const exists = await this.fileExists(fileName);
        if (!exists) {
            throw new NotFoundException(`File not found: ${fileName}`);
        }

        // Verify ownership before deletion
        await this.verifyOwnership(fileName, userId);

        try {
            await this.minioClient.removeObject(this.bucket, fileName);
        } catch (error) {
            throw new InternalServerErrorException('Failed to delete file');
        }
    }

    /**
     * Check if a file exists in the bucket
     * @param fileName Full path of the file
     * @returns True if file exists, false otherwise
     */
    async fileExists(fileName: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(this.bucket, fileName);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Verify that the user owns the file
     * Checks if the fileName starts with the userId (format: userId_type.ext)
     * @param fileName Full path of the file (format: userId_logo.ext or userId_cv.ext)
     * @param userId ID of the user
     * @throws ForbiddenException if user doesn't own the file
     */
    private async verifyOwnership(fileName: string, userId: string): Promise<void> {
        try {
            // Extract userId from fileName (format: userId_logo.ext or userId_cv.ext)
            const fileUserId = fileName.split('_')[0];
            
            // If the fileName doesn't contain the userId, check metadata as fallback
            if (fileUserId !== userId) {
                const stat = await this.minioClient.statObject(this.bucket, fileName);
                const metadata = stat.metaData || {};

                // Check if uploaderId metadata exists and matches
                const uploaderId = metadata['uploaderid'] || metadata['uploaderId'];

                if (uploaderId && uploaderId !== userId) {
                    throw new ForbiddenException('You do not have permission to access this file');
                }
                
                // If no metadata and fileName doesn't match, deny access
                if (!uploaderId) {
                    throw new ForbiddenException('You do not have permission to access this file');
                }
            }
            // If fileUserId matches userId, ownership is verified
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
        }
    }
}
