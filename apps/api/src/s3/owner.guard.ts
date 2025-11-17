import { CanActivate, ExecutionContext, Injectable, ForbiddenException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

/**
 * OwnerGuard - MinIO-specific guard to verify file ownership via object metadata
 * 
 * This guard is specialized for MinIO/S3 files where ownership is stored in object metadata.
 * It reads the uploaderId from MinIO metadata and compares it to req.user._id.
 * 
 * 
 * Expects:
 * - `req.user` to contain user info (from AuthGuard)
 * - `req.params.fileName` to contain the file path
 * 
 * Checks:
 * - File exists in MinIO
 * - File metadata contains uploaderId that matches the requesting user
 * - If uploaderId metadata exists and differs: ForbiddenException
 * - If uploaderId metadata is missing: access allowed (backward compatibility)
 */
@Injectable()
export class OwnerGuard implements CanActivate, OnModuleInit {
    private minioClient: Minio.Client;
    private bucket: string;

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit(): Promise<void> {
        const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
        const port = parseInt(this.configService.get<string>('MINIO_PORT') || '9000');
        const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
        const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
        const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');

        if (!endpoint || !accessKey || !secretKey) {
            throw new Error('MinIO configuration incomplete for OwnerGuard');
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

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<any>();

        const userId = req.user?._id || req.user?.sub || req.user?.id;
        if (!userId) {
            throw new BadRequestException('User ID not found on request');
        }

        const fileName = req.params?.fileName;
        if (!fileName) {
            throw new BadRequestException('fileName parameter is required');
        }

        // Validate path to prevent traversal
        if (this.containsPathTraversal(fileName)) {
            throw new ForbiddenException('Invalid file path');
        }

        // Get object metadata
        const stat = await this.minioClient.statObject(this.bucket, fileName);
        const metadata = stat.metaData || {};

        // Check uploaderId metadata
        const uploaderId = metadata['uploaderid'] || metadata['uploaderId'];

        // Verify ownership: author of request must match author of object
        if (uploaderId && uploaderId !== userId.toString()) {
            throw new ForbiddenException('You do not have permission to access this file');
        }

        return true;
    }

    /**
     * Basic path traversal check
     */
    private containsPathTraversal(path: string): boolean {
        return path.includes('..') || path.startsWith('/') || path.includes('\\\\');
    }
}
