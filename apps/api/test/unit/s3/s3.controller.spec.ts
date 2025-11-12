import { Test, TestingModule } from '@nestjs/testing';
import { S3Controller } from '../../../src/s3/s3.controller';
import { S3Service } from '../../../src/s3/s3.service';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { GeneratePresignedUploadDto } from '../../../src/s3/dto/generate-presigned.dto';
import { ForbiddenException } from '@nestjs/common';

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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [S3Controller],
      providers: [
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
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
        fileName: 'logos/1699999999-company-logo.png',
        uploadUrl: 'http://minio:9000/bucket/logos/1699999999-company-logo.png?signature=xyz',
      };

      mockS3Service.generatePresignedUploadUrl.mockResolvedValue(mockResult);

      const result = await controller.generateLogoUploadUrl(dto, mockRequest);

      expect(s3Service.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'company-logo.png',
        'logo',
        'user123',
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw error when user ID is missing', async () => {
      const dto: GeneratePresignedUploadDto = {
        originalFilename: 'logo.png',
      };

      const mockRequest = {
        user: {},
      };

      await expect(
        controller.generateLogoUploadUrl(dto, mockRequest),
      ).rejects.toThrow('User ID not found in request');
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
        fileName: 'cvs/1699999999-resume.pdf',
        uploadUrl: 'http://minio:9000/bucket/cvs/1699999999-resume.pdf?signature=abc',
      };

      mockS3Service.generatePresignedUploadUrl.mockResolvedValue(mockResult);

      const result = await controller.generateCvUploadUrl(dto, mockRequest);

      expect(s3Service.generatePresignedUploadUrl).toHaveBeenCalledWith(
        'resume.pdf',
        'cv',
        'user456',
      );
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

      expect(s3Service.generatePresignedDownloadUrl).toHaveBeenCalledWith(
        fileName,
        'user123',
      );
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

      await expect(
        controller.generateDownloadUrl(fileName, mockRequest),
      ).rejects.toThrow(ForbiddenException);
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

      await expect(
        controller.deleteFile(fileName, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
