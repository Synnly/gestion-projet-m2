import { S3Service } from '../../../src/s3/s3.service';

describe('S3Service', () => {
    let mockProvider: any;
    let service: S3Service;

    beforeEach(() => {
        mockProvider = {
            generatePresignedUploadUrl: jest.fn(),
            generatePresignedDownloadUrl: jest.fn(),
            generatePublicDownloadUrl: jest.fn(),
            deleteFile: jest.fn(),
            fileExists: jest.fn(),
        };

        service = new S3Service(mockProvider);
    });

    it('should delegate generatePresignedUploadUrl to provider and return its value', async () => {
        mockProvider.generatePresignedUploadUrl.mockResolvedValue('upload-url');

        const result = await service.generatePresignedUploadUrl('photo.png', 'logo', 'user-1');

        expect(mockProvider.generatePresignedUploadUrl).toHaveBeenCalledWith('photo.png', 'logo', 'user-1');
        expect(result).toBe('upload-url');
    });

    it('should delegate generatePresignedDownloadUrl to provider and return its value', async () => {
        mockProvider.generatePresignedDownloadUrl.mockResolvedValue('download-url');

        const result = await service.generatePresignedDownloadUrl('file.png', 'user-1');

        expect(mockProvider.generatePresignedDownloadUrl).toHaveBeenCalledWith('file.png', 'user-1');
        expect(result).toBe('download-url');
    });

    it('should delegate generatePublicDownloadUrl to provider and return its value', async () => {
        mockProvider.generatePublicDownloadUrl.mockResolvedValue('public-url');

        const result = await service.generatePublicDownloadUrl('file.png');

        expect(mockProvider.generatePublicDownloadUrl).toHaveBeenCalledWith('file.png');
        expect(result).toBe('public-url');
    });

    it('should delegate deleteFile to provider and return its value', async () => {
        mockProvider.deleteFile.mockResolvedValue(true);

        const result = await service.deleteFile('file.png', 'user-1');

        expect(mockProvider.deleteFile).toHaveBeenCalledWith('file.png', 'user-1');
        expect(result).toBe(true);
    });

    it('should delegate fileExists to provider and return its value', async () => {
        mockProvider.fileExists.mockResolvedValue(false);

        const result = await service.fileExists('file.png');

        expect(mockProvider.fileExists).toHaveBeenCalledWith('file.png');
        expect(result).toBe(false);
    });
});
