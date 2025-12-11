import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from 'src/application/application.schema';
import { Role } from 'src/common/roles/roles.enum';
import { IStorageProvider } from '../interfaces/IStorageProvider';
import * as Minio from 'minio';
import { URL_EXPIRY, PATH_REGEX } from '../s3.constants';
import { InvalidConfigurationException } from 'src/common/exceptions/invalidConfiguration.exception';

/**
 * MinIO-based implementation of the `IStorageProvider` interface.
 *
 * This class is responsible for interacting with a MinIO server (S3-compatible)
 * to generate presigned URLs, check existence, and delete objects. It also
 * performs basic safety checks (path validation) and ownership verification
 * using object metadata when available.
 */

export interface PresignedDownloadResult {
    downloadUrl: string;
}

export interface PresignedUploadResult {
    fileName: string;
    uploadUrl: string;
}

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
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Application.name) private readonly applicationModel?: Model<ApplicationDocument>,
    ) {
        const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
        const port = parseInt(this.configService.get<string>('MINIO_PORT') || '443');
        const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
        const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
        const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');

        this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'uploads';

        if (!endpoint || !accessKey || !secretKey || isNaN(port)) {
            throw new InvalidConfigurationException('Missing MinIO configuration in environment variables');
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
     * Generate a presigned PUT URL for file upload
     * @param originalFilename Original filename from client
     * @param fileType 'logo' or 'cv'
     * @param userId ID of the user uploading (for ownership tracking)
     * @returns Object containing the generated fileName and uploadUrl
     */

    async generatePresignedUploadUrl(
        originalFilename: string,
        fileType: 'logo' | 'cv' | 'lm',
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
    async generatePresignedDownloadUrl(fileName: string, userId: string, userRole?: string, postId?: string) {
        // Validate path to prevent traversal
        if (!PATH_REGEX.SAFE_PATH.test(fileName)) {
            throw new BadRequestException('Invalid file path');
        }

        // Check if file exists
        const exists = await this.fileExists(fileName);
        if (!exists) {
            throw new NotFoundException('File not found');
        }

        // Check ownership
        try {
            const stat = await this.minioClient.statObject(this.bucket, fileName);
            let uploaderId = stat.metaData?.uploaderid;

            // If uploaderId not in metadata, try to extract from filename (format: <uploaderId>_<...>)
            if (!uploaderId) {
                const possible = fileName.split('_')[0];
                if (possible && /^[0-9a-fA-F]{24}$/.test(possible)) uploaderId = possible;
            }

            // If uploaderId exists and does not match requesting user
            if (uploaderId && uploaderId !== userId) {
                // If requester is a student, deny access
                if (userRole === Role.STUDENT) {
                    throw new ForbiddenException('You do not have permission to access this file');
                }

                // If requester is a company, verify that there exists an application
                // where student == uploaderId and the post.company == requesting company
                if (userRole === Role.COMPANY) {
                    if (!this.applicationModel) {
                        // Application model not available -> deny
                        throw new ForbiddenException('You do not have permission to access this file');
                    }
                    const query: any = { deletedAt: { $exists: false } };
                    if (postId && /^[0-9a-fA-F]{24}$/.test(postId)) {
                        query.post = new Types.ObjectId(postId);
                    }
                    if (uploaderId && /^[0-9a-fA-F]{24}$/.test(uploaderId)) {
                        query.student = new Types.ObjectId(uploaderId);
                    }

                    const application = await this.applicationModel
                        .findOne(query)
                        .populate({ path: 'post', select: 'company' })
                        .exec();

                    if (!application || !application.post || !application.post.company) {
                        throw new ForbiddenException('You do not have permission to access this file');
                    }

                    const companyId = application.post.company?._id?.toString();
                    if (!companyId || companyId !== userId.toString()) {
                        throw new ForbiddenException('You do not have permission to access this file');
                    }

                    // else: allowed
                } else {
                    // Other roles are not allowed when uploader differs
                    throw new ForbiddenException('You do not have permission to access this file');
                }
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
            throw new InternalServerErrorException('Failed to generate download URL');
        }
    }

    /**
     * Generate a presigned GET URL for a file without any ownership checks.
     * Useful for public files or when access control is handled elsewhere.
     */
    async generatePublicDownloadUrl(fileName: string) {
        // Validate path to prevent traversal
        if (!PATH_REGEX.SAFE_PATH.test(fileName)) {
            throw new BadRequestException('Invalid file path');
        }
        if (!fileName.includes('logo')) {
            throw new BadRequestException('This file is not public');
        }
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
            throw new BadRequestException('Invalid file path');
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
