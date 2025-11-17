import { S3Service } from '../../../src/s3/s3.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import * as Minio from 'minio';

jest.mock('minio');

describe('S3Service (unit)', () => {
    const fakeConfig: any = {
        get: jest.fn().mockImplementation((k: string) => {
            switch (k) {
                case 'MINIO_ENDPOINT':
                    return 'fake';
                case 'MINIO_PORT':
                    return '9000';
                case 'MINIO_USE_SSL':
                    return 'false';
                case 'MINIO_ACCESS_KEY':
                    return 'key';
                case 'MINIO_SECRET_KEY':
                    return 'secret';
                case 'MINIO_BUCKET':
                    return 'uploads';
                default:
                    return undefined;
            }
        }),
    };

    // encryption was removed: tests use a lightweight stub if needed

    it('generatePresignedUploadUrl success and error branches', async () => {
        const svc = new S3Service(fakeConfig);
        svc['bucket'] = 'uploads';

        const mockClient: any = {
            presignedPutObject: jest.fn().mockResolvedValue('upload-url'),
        };
        svc['minioClient'] = mockClient;

        const res = await svc.generatePresignedUploadUrl('file.png', 'logo', 'uid');
        expect(res.uploadUrl).toBe('upload-url');

        // Simulate failure
        mockClient.presignedPutObject.mockRejectedValue(new Error('fail'));
        await expect(svc.generatePresignedUploadUrl('file.png', 'logo', 'uid')).rejects.toThrow(
            'Failed to generate upload URL',
        );
    });

    it('generatePresignedDownloadUrl NotFound and success', async () => {
        const svc = new S3Service(fakeConfig);
        svc['bucket'] = 'uploads';

        const mockClient: any = {
            presignedGetObject: jest.fn().mockResolvedValue('down-url'),
            statObject: jest.fn().mockRejectedValue(new Error('not found')),
        };
        svc['minioClient'] = mockClient;

        await expect(svc.generatePresignedDownloadUrl('file', 'uid')).rejects.toThrow();

        // now statObject returns, but verifyOwnership should not throw
        mockClient.statObject.mockResolvedValue({ metaData: { uploaderid: 'uid' } });
        const res = await svc.generatePresignedDownloadUrl('file', 'uid');
        expect(res.downloadUrl).toBe('down-url');
    });

    it('deleteFile not found and success', async () => {
        const svc = new S3Service(fakeConfig);
        svc['bucket'] = 'uploads';

        const mockClient: any = {
            statObject: jest.fn().mockRejectedValue(new Error('not found')),
            removeObject: jest.fn().mockResolvedValue(undefined),
        };
        svc['minioClient'] = mockClient;

        await expect(svc.deleteFile('file', 'uid')).rejects.toThrow();

        mockClient.statObject.mockResolvedValue({ metaData: { uploaderid: 'uid' } });
        await expect(svc.deleteFile('file', 'uid')).resolves.toBeUndefined();

        // removeObject throws
        mockClient.removeObject.mockRejectedValue(new Error('rmfail'));
        await expect(svc.deleteFile('file', 'uid')).rejects.toThrow('Failed to delete file');
    });

    it('should throw on invalid paths (monkeypatched PATH_REGEX)', async () => {
        const PATHS = require('../../../src/s3/s3.constants').PATH_REGEX;
        const original = PATHS.SAFE_PATH.test;
        PATHS.SAFE_PATH.test = () => false;

        const svc = new S3Service(fakeConfig);
        svc['bucket'] = 'uploads';
        svc['minioClient'] = { presignedPutObject: jest.fn().mockResolvedValue('u') } as any;

        await expect(svc.generatePresignedUploadUrl('file.png', 'logo', 'uid')).rejects.toThrow(
            'Invalid file path generated',
        );
        await expect(svc.generatePresignedDownloadUrl('file', 'uid')).rejects.toThrow();

        PATHS.SAFE_PATH.test = original;
    });
});

describe('S3Service', () => {
    let service: S3Service;
    let configService: ConfigService;
    let mockMinioClient: jest.Mocked<Minio.Client>;

    const mockConfigValues: Record<string, string> = {
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9000',
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin',
        MINIO_BUCKET: 'test-bucket',
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        mockMinioClient = {
            bucketExists: jest.fn(),
            makeBucket: jest.fn(),
            presignedPutObject: jest.fn(),
            presignedGetObject: jest.fn(),
            removeObject: jest.fn(),
            statObject: jest.fn(),
        } as any;

        (Minio.Client as jest.Mock).mockImplementation(() => mockMinioClient);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                S3Service,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => mockConfigValues[key]),
                    },
                },
                // encryption provider removed
            ],
        }).compile();

        service = module.get<S3Service>(S3Service);
        configService = module.get<ConfigService>(ConfigService);
        // encryption service removed from module
    });

    describe('onModuleInit', () => {
        it('should initialize MinIO client and ensure bucket exists', async () => {
            mockMinioClient.bucketExists.mockResolvedValue(true);

            await service.onModuleInit();

            expect(Minio.Client).toHaveBeenCalledWith({
                endPoint: 'localhost',
                port: 9000,
                useSSL: false,
                accessKey: 'minioadmin',
                secretKey: 'minioadmin',
            });
            expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
        });

        it('should create bucket if it does not exist', async () => {
            mockMinioClient.bucketExists.mockResolvedValue(false);
            mockMinioClient.makeBucket.mockResolvedValue(undefined);

            await service.onModuleInit();

            expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('test-bucket', '');
        });

        it('should throw error if MinIO configuration is incomplete', async () => {
            jest.spyOn(configService, 'get').mockReturnValue(undefined);

            await expect(service.onModuleInit()).rejects.toThrow('MinIO configuration incomplete');
        });

        it('should handle bucket creation errors', async () => {
            mockMinioClient.bucketExists.mockRejectedValue(new Error('Connection failed'));

            await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
        });
    });

    describe('generatePresignedUploadUrl', () => {
        beforeEach(async () => {
            mockMinioClient.bucketExists.mockResolvedValue(true);
            await service.onModuleInit();
        });

        it('should generate presigned URL for logo upload', async () => {
            const mockUrl = 'http://localhost:9000/test-bucket/logos/123-logo.png?signature=xyz';
            mockMinioClient.presignedPutObject.mockResolvedValue(mockUrl);

            const result = await service.generatePresignedUploadUrl('logo.png', 'logo', 'user123');

            expect(result.uploadUrl).toBe(mockUrl);
            expect(result.fileName).toMatch(/^logos\/\d+-logo\.png$/);
            expect(mockMinioClient.presignedPutObject).toHaveBeenCalledWith(
                'test-bucket',
                expect.stringMatching(/^logos\/\d+-logo\.png$/),
                600,
            );
        });

        it('should generate presigned URL for CV upload', async () => {
            const mockUrl = 'http://localhost:9000/test-bucket/cvs/456-resume.pdf?signature=abc';
            mockMinioClient.presignedPutObject.mockResolvedValue(mockUrl);

            const result = await service.generatePresignedUploadUrl('resume.pdf', 'cv', 'user456');

            expect(result.uploadUrl).toBe(mockUrl);
            expect(result.fileName).toMatch(/^cvs\/\d+-resume\.pdf$/);
        });

        it('should sanitize filename with special characters', async () => {
            const mockUrl = 'http://localhost:9000/test-bucket/logos/123-my_file_name.png';
            mockMinioClient.presignedPutObject.mockResolvedValue(mockUrl);

            const result = await service.generatePresignedUploadUrl('my file@name!.png', 'logo', 'user123');

            expect(result.fileName).toMatch(/^logos\/\d+-my_file_name_\.png$/);
        });

        it('should handle MinIO errors when generating upload URL', async () => {
            mockMinioClient.presignedPutObject.mockRejectedValue(new Error('MinIO error'));

            await expect(service.generatePresignedUploadUrl('logo.png', 'logo', 'user123')).rejects.toThrow(
                'Failed to generate upload URL',
            );
        });
    });

    describe('generatePresignedDownloadUrl', () => {
        beforeEach(async () => {
            mockMinioClient.bucketExists.mockResolvedValue(true);
            await service.onModuleInit();
        });

        it('should generate presigned download URL for existing file', async () => {
            const fileName = 'logos/123-logo.png';
            const mockDownloadUrl = 'http://localhost:9000/test-bucket/logos/123-logo.png?signature=download';

            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderid: 'user123' },
            } as any);
            mockMinioClient.presignedGetObject.mockResolvedValue(mockDownloadUrl);

            const result = await service.generatePresignedDownloadUrl(fileName, 'user123');

            expect(result.downloadUrl).toBe(mockDownloadUrl);
            expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith('test-bucket', fileName, 3600);
        });

        it('should throw NotFoundException if file does not exist', async () => {
            const fileName = 'logos/nonexistent.png';
            mockMinioClient.statObject.mockRejectedValue(new Error('Not found'));

            await expect(service.generatePresignedDownloadUrl(fileName, 'user123')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user does not own the file', async () => {
            const fileName = 'logos/123-logo.png';
            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderid: 'user456' },
            } as any);

            await expect(service.generatePresignedDownloadUrl(fileName, 'user123')).rejects.toThrow(ForbiddenException);
        });

        it('should allow download if file has no ownership metadata', async () => {
            const fileName = 'logos/123-logo.png';
            const mockDownloadUrl = 'http://localhost:9000/test-bucket/logos/123-logo.png';

            mockMinioClient.statObject.mockResolvedValue({
                metaData: {},
            } as any);
            mockMinioClient.presignedGetObject.mockResolvedValue(mockDownloadUrl);

            const result = await service.generatePresignedDownloadUrl(fileName, 'user123');

            expect(result.downloadUrl).toBe(mockDownloadUrl);
        });

        it('should validate path to prevent traversal', async () => {
            const fileName = '../../../etc/passwd';

            await expect(service.generatePresignedDownloadUrl(fileName, 'user123')).rejects.toThrow(
                'Invalid file path',
            );
        });
    });

    describe('deleteFile', () => {
        beforeEach(async () => {
            mockMinioClient.bucketExists.mockResolvedValue(true);
            await service.onModuleInit();
        });

        it('should delete file with ownership verification', async () => {
            const fileName = 'logos/123-logo.png';
            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderid: 'user123' },
            } as any);
            mockMinioClient.removeObject.mockResolvedValue(undefined);

            await service.deleteFile(fileName, 'user123');

            expect(mockMinioClient.removeObject).toHaveBeenCalledWith('test-bucket', fileName);
        });

        it('should throw NotFoundException if file does not exist', async () => {
            const fileName = 'logos/nonexistent.png';
            mockMinioClient.statObject.mockRejectedValue(new Error('Not found'));

            await expect(service.deleteFile(fileName, 'user123')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user does not own the file', async () => {
            const fileName = 'logos/123-logo.png';
            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderid: 'user456' },
            } as any);

            await expect(service.deleteFile(fileName, 'user123')).rejects.toThrow(ForbiddenException);
        });

        it('should validate path to prevent traversal', async () => {
            const fileName = '../../../etc/passwd';

            await expect(service.deleteFile(fileName, 'user123')).rejects.toThrow('Invalid file path');
        });
    });

    describe('fileExists', () => {
        beforeEach(async () => {
            mockMinioClient.bucketExists.mockResolvedValue(true);
            await service.onModuleInit();
        });

        it('should return true if file exists', async () => {
            const fileName = 'logos/123-logo.png';
            mockMinioClient.statObject.mockResolvedValue({} as any);

            const result = await service.fileExists(fileName);

            expect(result).toBe(true);
        });

        it('should return false if file does not exist', async () => {
            const fileName = 'logos/nonexistent.png';
            mockMinioClient.statObject.mockRejectedValue(new Error('Not found'));

            const result = await service.fileExists(fileName);

            expect(result).toBe(false);
        });
    });

    describe('generatePresignedDownloadUrl', () => {
        beforeEach(async () => {
            mockMinioClient.bucketExists.mockResolvedValue(true);
            await service.onModuleInit();
        });

        it('should generate download URL successfully', async () => {
            const userId = 'user123';
            const fileName = 'cvs/user123-file.pdf';
            const expectedUrl = 'https://minio.example.com/download/url';

            mockMinioClient.statObject.mockResolvedValue({ metaData: { userid: userId } } as any);
            mockMinioClient.presignedGetObject.mockResolvedValue(expectedUrl);

            const result = await service.generatePresignedDownloadUrl(fileName, userId);

            expect(result.downloadUrl).toBe(expectedUrl);
            expect(mockMinioClient.presignedGetObject).toHaveBeenCalled();
        });

        it('should throw error when presignedGetObject fails - line 165 coverage', async () => {
            const userId = 'user123';
            const fileName = 'cvs/user123-file.pdf';

            mockMinioClient.statObject.mockResolvedValue({ metaData: { userid: userId } } as any);
            mockMinioClient.presignedGetObject.mockRejectedValue(new Error('MinIO connection error'));

            await expect(service.generatePresignedDownloadUrl(fileName, userId)).rejects.toThrow(
                'Failed to generate download URL',
            );
        });
    });
});
