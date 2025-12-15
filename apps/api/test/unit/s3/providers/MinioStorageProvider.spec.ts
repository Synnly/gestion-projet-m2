import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import {
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import * as Minio from 'minio';
import { MinioStorageProvider } from '../../../../src/s3/providers/MinioStorageProvider';
import { URL_EXPIRY } from '../../../../src/s3/s3.constants';
import { InvalidConfigurationException } from 'src/common/exceptions/invalidConfiguration.exception';
import { Role } from '../../../../src/common/roles/roles.enum';

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
    const makeConfig = (overrides: Partial<Record<string, string>> = {}) =>
        ({
            get: (key: string) => overrides[key] ?? (config as any).get(key),
        }) as unknown as ConfigService;

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
            const res = await provider.generatePublicDownloadUrl('logos/f');
            expect(mockClient.presignedGetObject).toHaveBeenCalledWith('uploads', 'logos/f', URL_EXPIRY.DOWNLOAD);
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
    it('throws when configuration missing', () => {
        const cfg = makeConfig({ MINIO_ENDPOINT: '' } as any);
        expect(() => new MinioStorageProvider(cfg)).toThrow(InvalidConfigurationException);
    });

    it('generatePresignedUploadUrl - success when file does not exist', async () => {
        const cfg = makeConfig();

        const mockClient: any = {
            statObject: jest.fn().mockRejectedValue(new Error('not found')),
            presignedPutObject: jest.fn().mockResolvedValue('http://upload-url'),
            removeObject: jest.fn().mockResolvedValue(undefined),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        const provider = new MinioStorageProvider(cfg);
        const res = await provider.generatePresignedUploadUrl('file.png', 'logo', 'user1');
        expect(res.fileName).toBe('user1_logo.png');
        expect(res.uploadUrl).toBe('http://upload-url');
        expect(mockClient.presignedPutObject).toHaveBeenCalled();
    });

    it('generatePresignedUploadUrl - deletes existing file when stat succeeds', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({}),
            presignedPutObject: jest.fn().mockResolvedValue('http://upload-url'),
            removeObject: jest.fn().mockResolvedValue(undefined),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        const res = await provider.generatePresignedUploadUrl('file.jpg', 'cv', 'u1');
        expect(res.fileName).toBe('u1_cv.jpg');
        expect(mockClient.removeObject).toHaveBeenCalled();
    });

    it('generatePresignedUploadUrl - tolerates removeObject failure and still returns url', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({}),
            presignedPutObject: jest.fn().mockResolvedValue('http://upload-url'),
            removeObject: jest.fn().mockRejectedValue(new Error('delete failed')),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        const res = await provider.generatePresignedUploadUrl('file.png', 'logo', 'u2');
        expect(res.uploadUrl).toBe('http://upload-url');
        expect(mockClient.removeObject).toHaveBeenCalled();
    });

    it('generatePresignedUploadUrl - throws InternalServerError when presignedPutObject fails', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockRejectedValue(new Error('not found')),
            presignedPutObject: jest.fn().mockRejectedValue(new Error('put fail')),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.generatePresignedUploadUrl('badfile.png', 'logo', 'u3')).rejects.toThrow(
            InternalServerErrorException,
        );
    });

    it('generatePresignedDownloadUrl - throws NotFound when missing', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockRejectedValue(new Error('nope')),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.generatePresignedDownloadUrl('somefile.pdf', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('generatePresignedDownloadUrl - throws Forbidden when metadata mismatch', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: 'other' } }),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.generatePresignedDownloadUrl('somefile.pdf', 'user1')).rejects.toThrow(
            ForbiddenException,
        );
    });

    it('generatePresignedDownloadUrl - success returns downloadUrl', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: 'user1' } }),
            presignedGetObject: jest.fn().mockResolvedValue('http://download-url'),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        const res = await provider.generatePresignedDownloadUrl('somefile.pdf', 'user1');
        expect(res.downloadUrl).toBe('http://download-url');
    });

    it('generatePresignedDownloadUrl - student role gets Forbidden when uploader differs', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: 'student1234567890123456789012' } }),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(
            provider.generatePresignedDownloadUrl('somefile.pdf', 'differentUser', Role.STUDENT),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('generatePresignedDownloadUrl - company role allowed when application links student to company', async () => {
        const cfg = makeConfig();
        const studentId = '507f1f77bcf86cd799439011';
        const companyId = '507f1f77bcf86cd799439099';

        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: studentId } }),
            presignedGetObject: jest.fn().mockResolvedValue('http://download-url-company'),
        };

        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        // mock applicationModel with findOne(...).populate(...).exec() chain
        const mockAppModel: any = {
            findOne: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue({ post: { company: { _id: companyId } } }),
            }),
        };

        const provider = new MinioStorageProvider(cfg, mockAppModel as any);

        const res = await provider.generatePresignedDownloadUrl('somefile.pdf', companyId, Role.COMPANY);
        expect(res.downloadUrl).toBe('http://download-url-company');
        expect(mockAppModel.findOne).toHaveBeenCalled();
    });

    it('generatePresignedDownloadUrl - company role allowed when postId provided and matches application', async () => {
        const cfg = makeConfig();
        const studentId = '507f1f77bcf86cd799439011';
        const companyId = '507f1f77bcf86cd799439099';
        const postId = '507f1f77bcf86cd7994390ff';

        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: studentId } }),
            presignedGetObject: jest.fn().mockResolvedValue('http://download-url-company-post'),
        };

        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        // mock applicationModel to return application matching postId and student
        const mockAppModel: any = {
            findOne: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue({ post: { company: { _id: companyId } } }),
            }),
        };

        const provider = new MinioStorageProvider(cfg, mockAppModel as any);

        const res = await provider.generatePresignedDownloadUrl('somefile.pdf', companyId, Role.COMPANY, postId);
        expect(res.downloadUrl).toBe('http://download-url-company-post');
        expect(mockAppModel.findOne).toHaveBeenCalled();
        const calledQuery = mockAppModel.findOne.mock.calls[0][0];
        expect(calledQuery.post.toString()).toBe(new Types.ObjectId(postId).toString());
        expect(calledQuery.student.toString()).toBe(new Types.ObjectId(studentId).toString());
    });

    it('generatePresignedDownloadUrl - company role forbidden when postId provided but application not found', async () => {
        const cfg = makeConfig();
        const studentId = '507f1f77bcf86cd799439022';
        const companyId = '507f1f77bcf86cd799439033';
        const postId = '507f1f77bcf86cd7994390aa';

        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: studentId } }),
        };

        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        const mockAppModel: any = {
            findOne: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null),
            }),
        };

        const provider = new MinioStorageProvider(cfg, mockAppModel as any);

        await expect(
            provider.generatePresignedDownloadUrl('somefile.pdf', companyId, Role.COMPANY, postId),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('generatePresignedDownloadUrl - company role forbidden when application does not link to company', async () => {
        const cfg = makeConfig();
        const studentId = '507f1f77bcf86cd799439022';
        const companyId = '507f1f77bcf86cd799439033';

        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: studentId } }),
        };

        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        const mockAppModel: any = {
            findOne: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null),
            }),
        };

        const provider = new MinioStorageProvider(cfg, mockAppModel as any);

        await expect(provider.generatePresignedDownloadUrl('somefile.pdf', companyId, Role.COMPANY)).rejects.toBeInstanceOf(
            ForbiddenException,
        );
    });

    it('generatePresignedDownloadUrl - company role forbidden when application links to other company', async () => {
        const cfg = makeConfig();
        const studentId = '507f1f77bcf86cd799439044';
        const requestingCompanyId = '507f1f77bcf86cd799439055'; // requester
        const actualCompanyId = '507f1f77bcf86cd799439066'; // company on the application

        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: studentId } }),
        };

        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        const mockAppModel: any = {
            findOne: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue({ post: { company: { _id: actualCompanyId } } }),
            }),
        };

        const provider = new MinioStorageProvider(cfg, mockAppModel as any);

        await expect(
            provider.generatePresignedDownloadUrl('somefile.pdf', requestingCompanyId, Role.COMPANY),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('generatePresignedDownloadUrl - throws InternalServerError when presignedGetObject fails', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: 'user1' } }),
            presignedGetObject: jest.fn().mockRejectedValue(new Error('get fail')),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.generatePresignedDownloadUrl('somefile.pdf', 'user1')).rejects.toThrow(
            InternalServerErrorException,
        );
    });

    it('generatePublicDownloadUrl - validates path and returns url', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            presignedGetObject: jest.fn().mockResolvedValue('http://pub-url'),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        const res = await provider.generatePublicDownloadUrl('logos/public-file.pdf');
        expect(res.downloadUrl).toBe('http://pub-url');
    });

    it('generatePublicDownloadUrl - rejects non-logo public files with BadRequest', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            presignedGetObject: jest.fn().mockResolvedValue('http://pub-url'),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.generatePublicDownloadUrl('cvs/resume.pdf')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('generatePresignedDownloadUrl - student role forbidden when uploader parsed from filename differs', async () => {
        const cfg = makeConfig();
        // statObject returns no metadata, so uploaderId will be parsed from filename
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({}),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        const provider = new MinioStorageProvider(cfg);

        // filename starts with a 24-hex id (uploader) that differs from requesting user
        const uploaderId = '507f1f77bcf86cd7994390aa';
        await expect(
            provider.generatePresignedDownloadUrl(`${uploaderId}_cv.pdf`, 'someOtherUser', Role.STUDENT),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('generatePresignedDownloadUrl - throws Forbidden when uploader parsed from filename differs and no role provided', async () => {
        const cfg = makeConfig();
        const uploaderId = '507f1f77bcf86cd7994390cc';
        // statObject returns empty metadata so uploader will be parsed from filename
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({}),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        const provider = new MinioStorageProvider(cfg);

        await expect(provider.generatePresignedDownloadUrl(`${uploaderId}_cv.pdf`, 'differentUser')).rejects.toBeInstanceOf(
            ForbiddenException,
        );
    });

    it('generatePresignedDownloadUrl - company role forbidden when applicationModel not available', async () => {
        const cfg = makeConfig();
        const uploaderId = '507f1f77bcf86cd7994390bb';
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: uploaderId } }),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);

        // Create provider without applicationModel (undefined) to simulate missing model
        const provider = new MinioStorageProvider(cfg);

        await expect(
            provider.generatePresignedDownloadUrl('somefile.pdf', 'companyId', Role.COMPANY),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('generatePublicDownloadUrl - rejects invalid path', async () => {
        const cfg = makeConfig();
        const mockClient: any = { presignedGetObject: jest.fn() };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.generatePublicDownloadUrl('../etc/passwd')).rejects.toThrow(BadRequestException);
    });

    it('fileExists returns true on stat success and false on error', async () => {
        const cfg = makeConfig();
        const mockClientA: any = { statObject: jest.fn().mockResolvedValue({}) };
        (Minio.Client as unknown as jest.Mock).mockImplementationOnce(() => mockClientA);
        const provA = new MinioStorageProvider(cfg);
        expect(await provA.fileExists('f')).toBe(true);

        const mockClientB: any = { statObject: jest.fn().mockRejectedValue(new Error('no')) };
        (Minio.Client as unknown as jest.Mock).mockImplementationOnce(() => mockClientB);
        const provB = new MinioStorageProvider(cfg);
        expect(await provB.fileExists('f')).toBe(false);
    });

    it('deleteFile - throws Forbidden when uploader mismatch', async () => {
        const cfg = makeConfig();
        const mockClient: any = { statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: 'other' } }) };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.deleteFile('file.pdf', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('deleteFile - throws NotFound when stat fails', async () => {
        const cfg = makeConfig();
        const mockClient: any = { statObject: jest.fn().mockRejectedValue(new Error('nope')) };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.deleteFile('file.pdf', 'user1')).rejects.toThrow(NotFoundException);
    });

    it('deleteFile - success removes object when owner matches', async () => {
        const cfg = makeConfig();
        const mockClient: any = {
            statObject: jest.fn().mockResolvedValue({ metaData: { uploaderid: 'user1' } }),
            removeObject: jest.fn().mockResolvedValue(undefined),
        };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.deleteFile('file.pdf', 'user1')).resolves.toBeUndefined();
        expect(mockClient.removeObject).toHaveBeenCalled();
    });

    // New tests to cover error branches and invalid generated paths
    it('generatePresignedUploadUrl - rejects when generated filename is unsafe', async () => {
        const cfg = makeConfig();
        const mockClient: any = { presignedPutObject: jest.fn() };
        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        // Use a userId containing '..' to create an unsafe filename
        await expect(provider.generatePresignedUploadUrl('file.png', 'logo', '../bad')).rejects.toThrow(
            'Invalid file path generated',
        );
    });

    it('generatePresignedDownloadUrl - throws NotFound when statObject fails during ownership check', async () => {
        const cfg = makeConfig();

        const mockClient: any = {
            // First call (fileExists) resolves -> file appears to exist
            // Second call (ownership check) rejects -> should be translated to NotFound
            statObject: jest.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('boom')),
            presignedGetObject: jest.fn(),
        };

        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.generatePresignedDownloadUrl('somefile', 'me')).rejects.toBeInstanceOf(Error as any);
        // The provider wraps stat failures into NotFoundException specifically
        await expect(provider.generatePresignedDownloadUrl('somefile', 'me')).rejects.toThrow('File not found');
    });

    it('deleteFile - throws NotFound when statObject fails during ownership check', async () => {
        const cfg = makeConfig();

        const mockClient: any = {
            // fileExists returns true
            statObject: jest.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('boom')),
            removeObject: jest.fn(),
        };

        (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockClient);
        const provider = new MinioStorageProvider(cfg);

        await expect(provider.deleteFile('file.pdf', 'me')).rejects.toThrow('File not found');
    });
});
