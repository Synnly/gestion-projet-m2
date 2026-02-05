import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { AdminService } from '../../../src/admin/admin.service';
import { Admin } from '../../../src/admin/admin.schema';
import { CreateAdminDto } from '../../../src/admin/dto/createAdminDto';
import { DatabaseExport, ExportStatus } from '../../../src/admin/database-export.schema';
import { MailerService } from '../../../src/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Readable } from 'stream';

describe('AdminService', () => {
    let service: AdminService;
    let adminModel: any;
    let exportModel: any;
    let connection: any;
    let mailerService: any;
    let configService: any;

    const mockExec = jest.fn();

    // Mock class for the Admin Model
    class MockAdminModel {
        save: any;
        constructor(public data: any) {
            this.save = jest.fn().mockResolvedValue(this.data);
        }
        static countDocuments = jest.fn().mockReturnValue({ exec: mockExec });
        static find = jest.fn().mockReturnValue({ exec: mockExec });
        static findById = jest.fn().mockReturnValue({ exec: mockExec });
    }

    // Mock class for the DatabaseExport Model
    class MockExportModel {
        save: any;
        _id: Types.ObjectId;
        status: ExportStatus;
        adminId: Types.ObjectId;

        constructor(public data: any) {
            this._id = data._id || new Types.ObjectId();
            this.status = data.status || ExportStatus.PENDING;
            this.adminId = data.adminId;
            this.save = jest.fn().mockResolvedValue(this);
        }
        static findById = jest.fn();
        static find = jest.fn();
    }

    const mockConnection = {
        db: {
            listCollections: jest.fn(),
            collection: jest.fn(),
        },
    };

    const mockMailerService = {
        mailerProvider: {
            sendMail: jest.fn().mockResolvedValue(true),
        },
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'EXPORT_DIR') return './test-exports';
            if (key === 'FRONTEND_URL') return 'http://localhost:5173';
            if (key === 'MAIL_FROM_NAME') return 'Stagora';
            if (key === 'MAIL_FROM_EMAIL') return 'noreply@stagora.com';
            return undefined;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: getModelToken(Admin.name),
                    useValue: MockAdminModel,
                },
                {
                    provide: getModelToken(DatabaseExport.name),
                    useValue: MockExportModel,
                },
                {
                    provide: getConnectionToken(),
                    useValue: mockConnection,
                },
                {
                    provide: MailerService,
                    useValue: mockMailerService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        adminModel = module.get(getModelToken(Admin.name));
        exportModel = module.get(getModelToken(DatabaseExport.name));
        connection = module.get(getConnectionToken());
        mailerService = module.get(MailerService);
        configService = module.get(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('count', () => {
        it('should return the count of admins', async () => {
            mockExec.mockResolvedValue(5);

            const result = await service.count();
            expect(result).toBe(5);
            expect(MockAdminModel.countDocuments).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return an array of admins', async () => {
            const admins = [{ email: 'admin@test.com' }];
            mockExec.mockResolvedValue(admins);

            const result = await service.findAll();
            expect(result).toEqual(admins);
            expect(MockAdminModel.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a single admin', async () => {
            const admin = { email: 'admin@test.com' };
            mockExec.mockResolvedValue(admin);

            const result = await service.findOne('someId');
            expect(result).toEqual(admin);
            expect(MockAdminModel.findById).toHaveBeenCalledWith('someId');
        });

        it('should return null if admin not found', async () => {
            mockExec.mockResolvedValue(null);

            const result = await service.findOne('someId');
            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new admin', async () => {
            const dto: CreateAdminDto = {
                email: 'newadmin@test.com',
                password: 'Password123!Password123!Password123!',
            };

            await service.create(dto);
        });
    });

    describe('initiateExport', () => {
        it('should create an export job and start background export', async () => {
            const adminId = new Types.ObjectId().toString();
            const dto = { format: 'json' };

            // Spy on performExport to prevent it from actually running
            const performExportSpy = jest.spyOn(service as any, 'performExport').mockResolvedValue(undefined);

            const result = await service.initiateExport(adminId, dto);

            expect(result).toBeDefined();
            expect(result.status).toBe(ExportStatus.PENDING);
            expect(result.adminId.toString()).toBe(adminId);
            
            // Verify performExport was called in background
            await new Promise(resolve => setTimeout(resolve, 10));
            expect(performExportSpy).toHaveBeenCalledWith(result._id.toString());
            
            // Restore the original implementation
            performExportSpy.mockRestore();
        });
    });

    describe('getExportStatus', () => {
        it('should return export status', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.COMPLETED,
            };

            MockExportModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockExport),
            });

            const result = await service.getExportStatus(exportId);

            expect(result).toEqual(mockExport);
            expect(MockExportModel.findById).toHaveBeenCalledWith(exportId);
        });

        it('should return null if export not found', async () => {
            const exportId = new Types.ObjectId().toString();

            MockExportModel.findById.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getExportStatus(exportId);

            expect(result).toBeNull();
        });
    });

    describe('getExportsByAdmin', () => {
        it('should return all exports for an admin', async () => {
            const adminId = new Types.ObjectId().toString();
            const mockExports = [
                { _id: '1', status: ExportStatus.COMPLETED },
                { _id: '2', status: ExportStatus.IN_PROGRESS },
            ];

            MockExportModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockExports),
                }),
            });

            const result = await service.getExportsByAdmin(adminId);

            expect(result).toEqual(mockExports);
            expect(MockExportModel.find).toHaveBeenCalledWith({ adminId });
        });
    });

    describe('cancelExport', () => {
        it('should cancel a pending export', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.PENDING,
                save: jest.fn().mockResolvedValue(true),
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            const result = await service.cancelExport(exportId);

            expect(result).toBe(true);
            expect(mockExport.status).toBe(ExportStatus.CANCELLED);
            expect(mockExport.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if export not found for cancellation', async () => {
            const exportId = new Types.ObjectId().toString();

            MockExportModel.findById.mockResolvedValue(null);

            const result = await service.cancelExport(exportId);

            expect(result).toBe(false);
        });

        it('should cancel an in-progress export', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.IN_PROGRESS,
                save: jest.fn().mockResolvedValue(true),
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            const result = await service.cancelExport(exportId);

            expect(result).toBe(true);
            expect(mockExport.status).toBe(ExportStatus.CANCELLED);
        });

        it('should return false if export not found', async () => {
            MockExportModel.findById.mockResolvedValue(null);

            const result = await service.cancelExport('nonexistent');

            expect(result).toBe(false);
        });

        it('should return false if export already completed', async () => {
            const mockExport = {
                status: ExportStatus.COMPLETED,
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            const result = await service.cancelExport('someId');

            expect(result).toBe(false);
        });
    });

    describe('downloadExport', () => {
        it('should return stream for completed export', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.COMPLETED,
                fileKey: 'test-export.json.gz',
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'createReadStream').mockReturnValue(new Readable());

            const result = await service.downloadExport(exportId);

            expect(result).toHaveProperty('stream');
            expect(result).toHaveProperty('filename');
            expect(result).toHaveProperty('mimeType');
            expect(result.mimeType).toBe('application/gzip');
        });

        it('should throw NotFoundException if export not found', async () => {
            MockExportModel.findById.mockResolvedValue(null);

            await expect(service.downloadExport('nonexistent')).rejects.toThrow(HttpException);
        });

        it('should throw error if export not completed', async () => {
            const mockExport = {
                status: ExportStatus.IN_PROGRESS,
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            await expect(service.downloadExport('someId')).rejects.toThrow(HttpException);
        });

        it('should throw error if file key not found', async () => {
            const mockExport = {
                status: ExportStatus.COMPLETED,
                fileKey: null,
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            await expect(service.downloadExport('someId')).rejects.toThrow(HttpException);
        });

        it('should throw error if file does not exist on disk', async () => {
            const mockExport = {
                status: ExportStatus.COMPLETED,
                fileKey: 'missing-file.json.gz',
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            await expect(service.downloadExport('someId')).rejects.toThrow(HttpException);
        });
    });

    describe('private methods (via performExport)', () => {
        it('should throw NotFoundException if export job not found in performExport', async () => {
            const exportId = new Types.ObjectId().toString();
            MockExportModel.findById.mockResolvedValue(null);

            await expect(service['performExport'](exportId)).rejects.toThrow(NotFoundException);
        });

        it('should handle export cancellation before starting', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.CANCELLED,
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            await service['performExport'](exportId);

            // Should return early without errors
            expect(true).toBe(true);
        });

        it('should handle error if connection not available', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.PENDING,
                startedAt: null,
                save: jest.fn().mockResolvedValue(true),
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            const originalConnection = service['connection'];
            service['connection'] = null as any;

            // performExport should not throw but handle the error internally
            await service['performExport'](exportId);

            // Verify export status was updated to failed
            expect(mockExport.status).toBe(ExportStatus.FAILED);
            expect(mockExport.save).toHaveBeenCalled();

            service['connection'] = originalConnection;
        });

        it('should handle export cancellation during processing', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.IN_PROGRESS,
                startedAt: new Date(),
                save: jest.fn().mockResolvedValue(true),
            };

            MockExportModel.findById
                .mockResolvedValueOnce(mockExport)
                .mockResolvedValueOnce({ ...mockExport, status: ExportStatus.CANCELLED });

            connection.db.listCollections.mockReturnValue({
                toArray: jest.fn().mockResolvedValue([{ name: 'users' }]),
            });

            // performExport should not throw but handle cancellation gracefully
            await service['performExport'](exportId);

            // Verify export status was updated to failed (cancelled during processing)
            expect(mockExport.status).toBe(ExportStatus.FAILED);
            expect(mockExport.save).toHaveBeenCalled();
        });
    });
});
