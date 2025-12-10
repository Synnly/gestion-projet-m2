import { S3Service } from '../../../src/s3/s3.service';

describe('S3Service (unit) - provider delegation', () => {
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
        const expected = { fileName: 'user-1_logo.png', uploadUrl: 'http://upload-url' };
        mockProvider.generatePresignedUploadUrl.mockResolvedValue(expected);

        const result = await service.generatePresignedUploadUrl('photo.png', 'logo', 'user-1');

        expect(mockProvider.generatePresignedUploadUrl).toHaveBeenCalledWith('photo.png', 'logo', 'user-1');
        expect(result).toBe(expected);
    });

    it('should delegate generatePresignedDownloadUrl to provider and return its value', async () => {
        const expected = { downloadUrl: 'http://download-url' };
        mockProvider.generatePresignedDownloadUrl.mockResolvedValue(expected);

        const result = await service.generatePresignedDownloadUrl('file.png', 'user-1');

        expect(mockProvider.generatePresignedDownloadUrl).toHaveBeenCalledWith('file.png', 'user-1', undefined);
        expect(result).toBe(expected);
    });

    it('should delegate generatePublicDownloadUrl to provider and return its value', async () => {
        const expected = { downloadUrl: 'http://public-url' };
        mockProvider.generatePublicDownloadUrl.mockResolvedValue(expected);

        const result = await service.generatePublicDownloadUrl('file.png');

        expect(mockProvider.generatePublicDownloadUrl).toHaveBeenCalledWith('file.png');
        expect(result).toBe(expected);
    });

    it('should delegate deleteFile to provider and return its value', async () => {
        mockProvider.deleteFile.mockResolvedValue(undefined);

        const result = await service.deleteFile('file.png', 'user-1');

        expect(mockProvider.deleteFile).toHaveBeenCalledWith('file.png', 'user-1');
        expect(result).toBeUndefined();
    });

    it('should delegate fileExists to provider and return its value', async () => {
        mockProvider.fileExists.mockResolvedValue(true);

        const result = await service.fileExists('file.png');

        expect(mockProvider.fileExists).toHaveBeenCalledWith('file.png');
        expect(result).toBe(true);
    });
});
