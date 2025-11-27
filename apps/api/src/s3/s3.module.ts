import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Controller } from './s3.controller';
import { S3Service } from './s3.service';
import { STORAGE_PROVIDER, StorageProviderType } from './s3.constants';
import { MinioStorageProvider } from './providers/MinioStorageProvider';

@Module({})
export class S3Module {
    static register(options: { provider: StorageProviderType }): DynamicModule {
        let provider;

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
            imports: [ConfigModule],
            controllers: [S3Controller],
            providers: [provider, S3Service],
            exports: [S3Service],
        };
    }
}
