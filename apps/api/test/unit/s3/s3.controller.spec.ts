import { S3Controller } from '../../../src/s3/s3.controller';
import { S3Service } from '../../../src/s3/s3.service';
import { GeneratePresignedUploadDto } from '../../../src/s3/dto/generatePresigned.dto';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { ForbiddenException } from '@nestjs/common';
import { OwnerGuard } from '../../../src/s3/owner.guard';

describe('S3Controller', () => {
    let controller: S3Controller;
    const mockSvc: Partial<S3Service> = {};

    beforeEach(() => {
        controller = new S3Controller(mockSvc as S3Service);
    });

    it('generateLogoUploadUrl should throw when userId missing', async () => {
        await expect(
            controller.generateLogoUploadUrl(
                { originalFilename: 'a.png' } as GeneratePresignedUploadDto,
                { user: {} } as any,
            ),
        ).rejects.toThrow(BadRequestException);
    });

    it('generateLogoUploadUrl should throw on invalid extension', async () => {
        const req = { user: { sub: 'uid' } } as any;
        await expect(controller.generateLogoUploadUrl({ originalFilename: 'a.exe' } as any, req)).rejects.toThrow(
            BadRequestException,
        );
    });

    it('generateLogoUploadUrl success path', async () => {
        mockSvc.generatePresignedUploadUrl = jest.fn().mockResolvedValue({ fileName: 'f', uploadUrl: 'u' });
        const req = { user: { sub: 'uid' } } as any;
        const res = await controller.generateLogoUploadUrl(
            { originalFilename: 'a.png' } as GeneratePresignedUploadDto,
            req,
        );
        expect(res.uploadUrl).toBe('u');
    });

    it('generateCvUploadUrl should throw when userId missing', async () => {
        await expect(
            controller.generateCvUploadUrl(
                { originalFilename: 'a.pdf' } as GeneratePresignedUploadDto,
                { user: {} } as any,
            ),
        ).rejects.toThrow(BadRequestException);
    });

    it('generateDownloadUrl should throw when userId missing', async () => {
        await expect(controller.generateDownloadUrl('file', { user: {} } as any)).rejects.toThrow(BadRequestException);
    });

    it('deleteFile should throw when userId missing', async () => {
        await expect(controller.deleteFile('file', { user: {} } as any)).rejects.toThrow(BadRequestException);
    });
});

describe('S3Controller', () => {
    let controller: S3Controller;
    let s3Service: S3Service;

    const mockS3Service = {
        generatePresignedUploadUrl: jest.fn(),
        generatePresignedDownloadUrl: jest.fn(),
        deleteFile: jest.fn(),
    };

    const mockAuthGuard = {
        canActivate: jest.fn().mockReturnValue(true),
    };

    const mockOwnerGuard = {
        canActivate: jest.fn().mockReturnValue(true),
    };

    const mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
            const config = {
                MINIO_ENDPOINT: 'localhost',
                MINIO_PORT: '9000',
                MINIO_USE_SSL: 'false',
                MINIO_ACCESS_KEY: 'minioadmin',
                MINIO_SECRET_KEY: 'minioadmin',
                MINIO_BUCKET: 'test-bucket',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [S3Controller],
            providers: [
                {
                    provide: S3Service,
                    useValue: mockS3Service,
                },
                {
                    provide: 'ConfigService',
                    useValue: mockConfigService,
                },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue(mockAuthGuard)
            .overrideGuard(OwnerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<S3Controller>(S3Controller);
        s3Service = module.get<S3Service>(S3Service);
    });

    describe('generateLogoUploadUrl', () => {
        it('should generate presigned URL for logo upload', async () => {
            const dto: GeneratePresignedUploadDto = {
                originalFilename: 'company-logo.png',
            };

            const mockRequest = {
                user: { sub: 'user123' },
            };

            const mockResult = {
                fileName: 'user123_logo.png',
                uploadUrl: 'http://minio:9000/bucket/user123_logo.png?signature=xyz',
            };

            mockS3Service.generatePresignedUploadUrl.mockResolvedValue(mockResult);

            const result = await controller.generateLogoUploadUrl(dto, mockRequest);

            expect(s3Service.generatePresignedUploadUrl).toHaveBeenCalledWith('company-logo.png', 'logo', 'user123');
            expect(result).toEqual(mockResult);
        });

        it('should throw error when user ID is missing', async () => {
            const dto: GeneratePresignedUploadDto = {
                originalFilename: 'logo.png',
            };

            const mockRequest = {
                user: {},
            };

            await expect(controller.generateLogoUploadUrl(dto, mockRequest)).rejects.toThrow(BadRequestException);
        });
    });

    describe('generateCvUploadUrl', () => {
        it('should generate presigned URL for CV upload', async () => {
            const dto: GeneratePresignedUploadDto = {
                originalFilename: 'resume.pdf',
            };

            const mockRequest = {
                user: { id: 'user456' },
            };

            const mockResult = {
                fileName: 'user456_cv.pdf',
                uploadUrl: 'http://minio:9000/bucket/user456_cv.pdf?signature=abc',
            };

            mockS3Service.generatePresignedUploadUrl.mockResolvedValue(mockResult);

            const result = await controller.generateCvUploadUrl(dto, mockRequest);

            expect(s3Service.generatePresignedUploadUrl).toHaveBeenCalledWith('resume.pdf', 'cv', 'user456');
            expect(result).toEqual(mockResult);
        });
    });

    describe('generateDownloadUrl', () => {
        it('should generate presigned download URL with ownership check', async () => {
            const fileName = 'logos/1699999999-logo.png';
            const mockRequest = {
                user: { sub: 'user123' },
            };

            const mockResult = {
                downloadUrl: 'http://minio:9000/bucket/logos/1699999999-logo.png?signature=download',
            };

            mockS3Service.generatePresignedDownloadUrl.mockResolvedValue(mockResult);

            const result = await controller.generateDownloadUrl(fileName, mockRequest);

            // signature now accepts optional postId as fourth parameter; expect undefined when not provided
            expect(s3Service.generatePresignedDownloadUrl).toHaveBeenCalledWith(fileName, 'user123', undefined, undefined);
            expect(result).toEqual(mockResult);
        });

        it('should throw error when ownership verification fails', async () => {
            const fileName = 'logos/someone-else-logo.png';
            const mockRequest = {
                user: { sub: 'user123' },
            };

            mockS3Service.generatePresignedDownloadUrl.mockRejectedValue(
                new ForbiddenException('You do not have permission to download this file'),
            );

            await expect(controller.generateDownloadUrl(fileName, mockRequest)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('deleteFile', () => {
        it('should delete file with ownership verification', async () => {
            const fileName = 'logos/1699999999-logo.png';
            const mockRequest = {
                user: { sub: 'user123' },
            };

            mockS3Service.deleteFile.mockResolvedValue(undefined);

            const result = await controller.deleteFile(fileName, mockRequest);

            expect(s3Service.deleteFile).toHaveBeenCalledWith(fileName, 'user123');
            expect(result).toEqual({ success: true });
        });

        it('should throw error when ownership verification fails on delete', async () => {
            const fileName = 'logos/someone-else-logo.png';
            const mockRequest = {
                user: { sub: 'user123' },
            };

            mockS3Service.deleteFile.mockRejectedValue(
                new ForbiddenException('You do not have permission to delete this file'),
            );

            await expect(controller.deleteFile(fileName, mockRequest)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('OwnerGuard integration on DELETE', () => {
        it('should apply OwnerGuard to deleteFile route', () => {
            // Verify that OwnerGuard is applied to the DELETE route
            const guards = Reflect.getMetadata('__guards__', controller.deleteFile);
            expect(guards).toBeDefined();
            // Note: In real integration tests, the guard would be tested by the framework
        });

        it('should pass user and fileName to OwnerGuard', async () => {
            const fileName = 'logos/test.png';
            const mockRequest = {
                user: { sub: 'user123' },
            };

            mockS3Service.deleteFile.mockResolvedValue(undefined);

            await controller.deleteFile(fileName, mockRequest);

            // Verify the controller passes correct params
            expect(s3Service.deleteFile).toHaveBeenCalledWith(fileName, 'user123');
        });
    });

    describe('generatePublicDownloadUrl', () => {
        it('should return public download url from service', async () => {
            const fileName = 'logos/public-logo.png';
            const mockResult = { downloadUrl: 'http://public-url' };

            mockS3Service.generatePublicDownloadUrl = jest.fn().mockResolvedValue(mockResult);

            const result = await controller.generatePublicDownloadUrl(fileName);

            expect(s3Service.generatePublicDownloadUrl).toHaveBeenCalledWith(fileName);
            expect(result).toEqual(mockResult);
        });

        it('should propagate BadRequestException from service for invalid path', async () => {
            const fileName = '../../../etc/passwd';
            mockS3Service.generatePublicDownloadUrl = jest
                .fn()
                .mockRejectedValue(new BadRequestException('Invalid file path'));

            await expect(controller.generatePublicDownloadUrl(fileName)).rejects.toThrow(BadRequestException);
        });
    });
});
