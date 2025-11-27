import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Controller } from './s3.controller';
import { S3Service } from './s3.service';
import { STORAGE_PROVIDER, StorageProviderType } from './s3.constants';
import { MinioStorageProvider } from './providers/MinioStorageProvider';
import { IStorageProvider } from './interfaces/IStorageProvider';
import { OwnerGuard } from './owner.guard';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({})
export class S3Module {
    static register(options: { provider: StorageProviderType }): DynamicModule {
        let provider: {
            provide: symbol;
            useClass: new (...args: any[]) => IStorageProvider;
        };

        switch (options.provider) {
            case StorageProviderType.MINIO:
            default:
                provider = {
                    provide: STORAGE_PROVIDER,
                    useClass: MinioStorageProvider,
                };
        }

        return {
            module: S3Module,
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
            providers: [provider, S3Service, OwnerGuard],
            exports: [S3Service],
        };
    }
}
