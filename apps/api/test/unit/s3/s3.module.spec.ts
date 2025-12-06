import { S3Module } from '../../../src/s3/s3.module';
import { StorageProviderType } from '../../../src/s3/s3.constants';
import { InvalidConfigurationException } from '../../../src/common/exceptions/invalidConfiguration.exception';

describe('S3Module', () => {
    it('registers Minio provider when StorageProviderType.MINIO is provided', () => {
        const mod = S3Module.register({ provider: StorageProviderType.MINIO });
        expect(mod).toBeDefined();
        expect(mod.module).toBeDefined();
        // basic sanity: controllers and providers set
        expect(mod.controllers).toBeDefined();
        expect(Array.isArray(mod.providers)).toBeTruthy();
    });

    it('throws for unsupported provider', () => {
        expect(() => S3Module.register({ provider: 'unknown' as any })).toThrow(InvalidConfigurationException);
    });
});
