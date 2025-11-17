import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { S3Controller } from './s3.controller';
import { S3Service } from './s3.service';
import { OwnerGuard } from './owner.guard';

/**
 * S3Module - Simplified file management module
 * 
 * Provides secure file storage via MinIO with:
 * - Presigned URLs for direct client-to-MinIO uploads/downloads
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
    providers: [S3Service, OwnerGuard],
    exports: [S3Service],
})
export class S3Module {}
