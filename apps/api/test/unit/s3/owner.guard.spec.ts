import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { OwnerGuard } from '../../../src/s3/owner.guard';
import * as Minio from 'minio';

jest.mock('minio');

describe('OwnerGuard', () => {
    let guard: OwnerGuard;
    let configService: ConfigService;
    let mockMinioClient: jest.Mocked<Minio.Client>;

    const mockConfigValues = {
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
            statObject: jest.fn(),
        } as any;

        (Minio.Client as jest.Mock).mockImplementation(() => mockMinioClient);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OwnerGuard,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => mockConfigValues[key]),
                    },
                },
            ],
        }).compile();

        guard = module.get<OwnerGuard>(OwnerGuard);
        configService = module.get<ConfigService>(ConfigService);

        // Initialize MinIO client
        await guard.onModuleInit();
    });

    const createMockContext = (userId: string | null, fileName: string | null): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: userId ? { _id: userId, sub: userId } : {},
                    params: fileName ? { fileName } : {},
                }),
            }),
        } as any;
    };

    describe('canActivate', () => {
        it('should allow access when uploaderId matches userId', async () => {
            const userId = 'user123';
            const fileName = 'logos/test-logo.png';

            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderId: userId },
            } as any);

            const context = createMockContext(userId, fileName);
            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockMinioClient.statObject).toHaveBeenCalledWith('test-bucket', fileName);
        });

        it('should allow access when no uploaderId metadata exists (backward compatibility)', async () => {
            const userId = 'user123';
            const fileName = 'logos/legacy-file.png';

            mockMinioClient.statObject.mockResolvedValue({
                metaData: {},
            } as any);

            const context = createMockContext(userId, fileName);
            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should throw ForbiddenException when uploaderId does not match userId', async () => {
            const userId = 'user123';
            const fileName = 'logos/other-user-logo.png';

            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderId: 'user456' },
            } as any);

            const context = createMockContext(userId, fileName);

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('You do not have permission to access this file');
        });

        it('should throw BadRequestException when user ID is not found', async () => {
            const context = createMockContext(null, 'logos/test.png');

            await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
            await expect(guard.canActivate(context)).rejects.toThrow('User ID not found on request');
        });

        it('should throw BadRequestException when fileName is not found', async () => {
            const context = createMockContext('user123', null);

            await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
            await expect(guard.canActivate(context)).rejects.toThrow('fileName parameter is required');
        });

        it('should throw ForbiddenException for path traversal attempts', async () => {
            const userId = 'user123';
            const fileName = '../../../etc/passwd';

            const context = createMockContext(userId, fileName);

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('Invalid file path');
        });

        it('should reject paths with leading slash', async () => {
            const userId = 'user123';
            const fileName = '/absolute/path/file.txt';

            const context = createMockContext(userId, fileName);

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        });

        it('should reject paths with backslashes', async () => {
            const userId = 'user123';
            const fileName = 'path\\\\with\\\\backslash';

            const context = createMockContext(userId, fileName);

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        });

        it('should work with user.sub as userId source', async () => {
            const userId = 'user-from-sub';
            const fileName = 'cvs/resume.pdf';

            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderId: userId },
            } as any);

            const context = {
                switchToHttp: () => ({
                    getRequest: () => ({
                        user: { sub: userId }, // Only sub, no _id
                        params: { fileName },
                    }),
                }),
            } as any;

            const result = await guard.canActivate(context);
            expect(result).toBe(true);
        });

        it('should work with user.id as userId source', async () => {
            const userId = 'user-from-id';
            const fileName = 'cvs/resume.pdf';

            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderId: userId },
            } as any);

            const context = {
                switchToHttp: () => ({
                    getRequest: () => ({
                        user: { id: userId }, // Only id
                        params: { fileName },
                    }),
                }),
            } as any;

            const result = await guard.canActivate(context);
            expect(result).toBe(true);
        });

        it('should check uploaderid metadata (lowercase)', async () => {
            const userId = 'user123';
            const fileName = 'logos/test.png';

            mockMinioClient.statObject.mockResolvedValue({
                metaData: { uploaderid: userId }, // lowercase
            } as any);

            const context = createMockContext(userId, fileName);
            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should handle MinIO errors gracefully', async () => {
            const userId = 'user123';
            const fileName = 'logos/nonexistent.png';

            mockMinioClient.statObject.mockRejectedValue(new Error('NotFound'));

            const context = createMockContext(userId, fileName);

            await expect(guard.canActivate(context)).rejects.toThrow();
        });
    });

    describe('onModuleInit', () => {
        it('should initialize MinIO client with correct configuration', async () => {
            expect(Minio.Client).toHaveBeenCalledWith({
                endPoint: 'localhost',
                port: 9000,
                useSSL: false,
                accessKey: 'minioadmin',
                secretKey: 'minioadmin',
            });
        });

        it('should throw error if configuration is incomplete', async () => {
            const incompleteConfigService = {
                get: jest.fn().mockReturnValue(undefined),
            };

            const module = await Test.createTestingModule({
                providers: [
                    OwnerGuard,
                    {
                        provide: ConfigService,
                        useValue: incompleteConfigService,
                    },
                ],
            }).compile();

            const guardWithBadConfig = module.get<OwnerGuard>(OwnerGuard);

            await expect(guardWithBadConfig.onModuleInit()).rejects.toThrow(
                'MinIO configuration incomplete for OwnerGuard',
            );
        });
    });
});
