import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { S3Controller } from './s3.controller';
import { S3Service } from './s3.service';
import { EncryptionService } from './encryption.service';

/**
 * S3Module - Simplified file management module
 * 
 * Provides secure file storage via MinIO with:
 * - Presigned URLs for direct client-to-MinIO uploads/downloads
 * - AES-256-GCM encryption for all stored files
 * - Authentication and ownership verification
 * - Rate limiting
 * 
 * Note: AuthGuard is available via the global AuthModule
 */
@Module({
    imports: [
        ConfigModule,
        ThrottlerModule.forRoot([
            {
                ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000'),
                limit: parseInt(process.env.RATE_LIMIT_MAX || '100'),
            },
        ]),
    ],
    controllers: [S3Controller],
    providers: [S3Service, EncryptionService],
    exports: [S3Service],
})
export class S3Module {}
