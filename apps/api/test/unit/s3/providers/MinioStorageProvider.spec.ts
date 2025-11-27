import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import * as Minio from 'minio';
import { MinioStorageProvider } from '../../../../src/s3/providers/MinioStorageProvider';
import { PATH_REGEX, URL_EXPIRY } from '../../../../src/s3/s3.constants';

describe('MinioStorageProvider', () => {
    let mockClient: any;
    let config: Partial<ConfigService>;
    let provider: MinioStorageProvider;

    beforeEach(() => {
        mockClient = {
            presignedPutObject: jest.fn(),
            presignedGetObject: jest.fn(),
            statObject: jest.fn(),
            removeObject: jest.fn(),
        };

        // Replace Minio.Client constructor to return our mock client
        (Minio as any).Client = jest.fn().mockImplementation(() => mockClient);

        config = {
            get: (key: string) => {
                const map: Record<string, string> = {
                    MINIO_ENDPOINT: 'localhost',
                    MINIO_PORT: '9000',
                    MINIO_USE_SSL: 'false',
                    MINIO_ACCESS_KEY: 'access',
                    MINIO_SECRET_KEY: 'secret',
                    MINIO_BUCKET: 'uploads',
                };
                return map[key];
            },
        };

        provider = new MinioStorageProvider(config as ConfigService);
    });

    it('throws when missing config', () => {
        const badConfig = { get: () => undefined } as unknown as ConfigService;
        expect(() => new MinioStorageProvider(badConfig)).toThrow(/Missing MinIO configuration/);
    });

    it('constructs Minio.Client with parsed values', () => {
        expect((Minio as any).Client).toHaveBeenCalledTimes(1);
        const calledWith = (Minio as any).Client.mock.calls[0][0];
        expect(calledWith).toMatchObject({
            endPoint: 'localhost',
            port: 9000,
            useSSL: false,
            accessKey: 'access',
            secretKey: 'secret',
        });
    });

    describe('generatePresignedUploadUrl', () => {
        it('returns filename and url with lower-cased extension', async () => {
            mockClient.presignedPutObject.mockResolvedValue('upload-url');

            const res = await provider.generatePresignedUploadUrl('Photo.PNG', 'logo', 'uid1');

            expect(mockClient.presignedPutObject).toHaveBeenCalledWith('uploads', 'uid1_logo.png', URL_EXPIRY.UPLOAD);
            expect(res).toEqual({ fileName: 'uid1_logo.png', uploadUrl: 'upload-url' });
        });

        it('throws generic error when client fails', async () => {
            mockClient.presignedPutObject.mockRejectedValue(new Error('boom'));
            await expect(provider.generatePresignedUploadUrl('a.txt', 'cv', 'u')).rejects.toThrow(
                'Failed to generate upload URL',
            );
        });
    });

    describe('fileExists', () => {
        it('returns true when statObject succeeds', async () => {
            mockClient.statObject.mockResolvedValue({});
            await expect(provider.fileExists('file')).resolves.toBe(true);
        });

        it('returns false when statObject throws', async () => {
            mockClient.statObject.mockRejectedValue(new Error('not found'));
            await expect(provider.fileExists('file')).resolves.toBe(false);
        });
    });

    describe('generatePresignedDownloadUrl', () => {
        it('rejects invalid path', async () => {
            await expect(provider.generatePresignedDownloadUrl('../etc/passwd', 'u')).rejects.toThrow(
                'Invalid file path',
            );
        });

        it('throws NotFoundException when file does not exist', async () => {
            mockClient.statObject.mockRejectedValue(new Error('not found'));
            await expect(provider.generatePresignedDownloadUrl('somefile', 'u')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('throws ForbiddenException when uploader differs', async () => {
            mockClient.statObject.mockResolvedValue({ metaData: { uploaderid: 'other' } });
            await expect(provider.generatePresignedDownloadUrl('somefile', 'me')).rejects.toBeInstanceOf(
                ForbiddenException,
            );
        });

        it('returns downloadUrl on success', async () => {
            mockClient.statObject.mockResolvedValue({ metaData: { uploaderid: 'me' } });
            mockClient.presignedGetObject.mockResolvedValue('download-url');

            const res = await provider.generatePresignedDownloadUrl('somefile', 'me');
            expect(mockClient.presignedGetObject).toHaveBeenCalledWith('uploads', 'somefile', URL_EXPIRY.DOWNLOAD);
            expect(res).toEqual({ downloadUrl: 'download-url' });
        });

        it('wraps presignedGetObject errors', async () => {
            mockClient.statObject.mockResolvedValue({});
            mockClient.presignedGetObject.mockRejectedValue(new Error('boom'));
            await expect(provider.generatePresignedDownloadUrl('somefile', 'me')).rejects.toThrow(
                'Failed to generate download URL',
            );
        });
    });

    describe('generatePublicDownloadUrl', () => {
        it('delegates to presignedGetObject and returns url', async () => {
            mockClient.presignedGetObject.mockResolvedValue('public-url');
            const res = await provider.generatePublicDownloadUrl('f');
            expect(mockClient.presignedGetObject).toHaveBeenCalledWith('uploads', 'f', URL_EXPIRY.DOWNLOAD);
            expect(res).toEqual({ downloadUrl: 'public-url' });
        });
    });

    describe('deleteFile', () => {
        it('rejects invalid path', async () => {
            await expect(provider.deleteFile('/abs/path', 'u')).rejects.toThrow('Invalid file path');
        });

        it('throws NotFoundException when file missing', async () => {
            mockClient.statObject.mockRejectedValue(new Error('no'));
            await expect(provider.deleteFile('file', 'u')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('throws ForbiddenException when uploader differs', async () => {
            mockClient.statObject.mockResolvedValue({ metaData: { uploaderid: 'other' } });
            await expect(provider.deleteFile('file', 'me')).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('calls removeObject on success', async () => {
            mockClient.statObject.mockResolvedValue({ metaData: { uploaderid: 'me' } });
            mockClient.removeObject.mockResolvedValue(undefined);
            await expect(provider.deleteFile('file', 'me')).resolves.toBeUndefined();
            expect(mockClient.removeObject).toHaveBeenCalledWith('uploads', 'file');
        });
    });
});
