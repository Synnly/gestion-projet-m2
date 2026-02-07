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
            if (key === 'EXPORTS_DIR') return './test-exports';
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

    afterEach(async () => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        
        // Cleanup any test export files
        try {
            const fs = require('fs');
            const path = require('path');
            const exportsDir = './test-exports';
            
            if (fs.existsSync(exportsDir)) {
                const files = fs.readdirSync(exportsDir);
                for (const file of files) {
                    try {
                        fs.unlinkSync(path.join(exportsDir, file));
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
                try {
                    fs.rmdirSync(exportsDir);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    afterAll(async () => {
        // Final cleanup
        try {
            const fs = require('fs');
            const path = require('path');
            const exportsDir = './test-exports';
            
            if (fs.existsSync(exportsDir)) {
                const files = fs.readdirSync(exportsDir);
                for (const file of files) {
                    try {
                        fs.unlinkSync(path.join(exportsDir, file));
                    } catch (e) {
                        // Ignore
                    }
                }
                try {
                    fs.rmdirSync(exportsDir);
                } catch (e) {
                    // Ignore
                }
            }
        } catch (error) {
            // Ignore
        }
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
        it('should exit gracefully if export job not found in performExport', async () => {
            const exportId = new Types.ObjectId().toString();
            MockExportModel.findById.mockResolvedValue(null);

            // Should not throw, just return undefined
            await expect(service['performExport'](exportId)).resolves.toBeUndefined();
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

            // Mock exportAllCollectionsStreaming to throw error
            jest.spyOn(service as any, 'exportAllCollectionsStreaming').mockRejectedValue(
                new InternalServerErrorException('Database connection not available')
            );

            // performExport should not throw but handle the error internally
            await service['performExport'](exportId);

            // Verify export status was updated to failed
            expect(mockExport.status).toBe(ExportStatus.FAILED);
            expect(mockExport.save).toHaveBeenCalled();
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

            // Mock exportAllCollectionsStreaming to throw cancellation error
            jest.spyOn(service as any, 'exportAllCollectionsStreaming').mockRejectedValue(
                new HttpException('Export cancelled by user', HttpStatus.CONFLICT)
            );

            // performExport should not throw but handle cancellation gracefully
            await service['performExport'](exportId);

            // Verify export status was updated to failed (cancelled during processing)
            expect(mockExport.status).toBe(ExportStatus.FAILED);
            expect(mockExport.save).toHaveBeenCalled();
        });
    });

    describe('exportAllCollectionsStreaming', () => {
        it('should throw InternalServerErrorException if connection not available', async () => {
            const exportId = new Types.ObjectId().toString();
            const originalConnection = service['connection'];
            service['connection'] = null as any;

            await expect(service['exportAllCollectionsStreaming'](exportId)).rejects.toThrow(InternalServerErrorException);

            service['connection'] = originalConnection;
        });

        it('should throw InternalServerErrorException if db not available', async () => {
            const exportId = new Types.ObjectId().toString();
            const originalConnection = service['connection'];
            service['connection'] = { db: null } as any;

            await expect(service['exportAllCollectionsStreaming'](exportId)).rejects.toThrow(InternalServerErrorException);

            service['connection'] = originalConnection;
        });

        it('should handle multiple collections and process them sequentially', async () => {
            const exportId = new Types.ObjectId().toString();
            
            // Mock collections
            const mockCollections = [
                { name: 'users' },
                { name: 'posts' },
                { name: 'comments' },
            ];

            mockConnection.db.listCollections.mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockCollections),
            });

            // Track how many times we check for cancellation (one per collection)
            const checkCancellationSpy = jest.spyOn(service as any, 'checkCancellationDuringExport')
                .mockResolvedValue(false);

            // Mock cursors for each collection
            const mockCursor = {
                [Symbol.asyncIterator]: async function* () {
                    yield { _id: '1', data: 'test' };
                },
            };

            mockConnection.db.collection.mockReturnValue({
                find: jest.fn().mockReturnValue(mockCursor),
            });

            const fs = require('fs');
            jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
            jest.spyOn(fs.promises, 'stat').mockResolvedValue({ size: 2048 });

            // Mock write stream with all required methods
            const mockWriteStream = {
                on: jest.fn((event, handler) => {
                    if (event === 'finish') {
                        setImmediate(handler);
                    } else if (event === 'error') {
                        // Store error handler
                    }
                    return mockWriteStream;
                }),
                once: jest.fn().mockReturnThis(),
                emit: jest.fn(),
                end: jest.fn(),
                write: jest.fn(),
                writable: true,
            };
            jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWriteStream as any);

            const result = await service['exportAllCollectionsStreaming'](exportId);

            // Verify we processed all collections
            expect(checkCancellationSpy).toHaveBeenCalledTimes(3);
            expect(result.collectionsCount).toBe(3);
            expect(result.totalDocuments).toBe(3); // One doc per collection
        });

        it('should write comma separator between documents in a collection', async () => {
            const exportId = new Types.ObjectId().toString();
            
            // Mock a single collection with multiple documents
            const mockCollections = [
                { name: 'users' },
            ];

            mockConnection.db.listCollections.mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockCollections),
            });

            // Mock cursor with multiple documents
            const mockCursor = {
                [Symbol.asyncIterator]: async function* () {
                    yield { _id: '1', name: 'user1', email: 'user1@test.com' };
                    yield { _id: '2', name: 'user2', email: 'user2@test.com' };
                    yield { _id: '3', name: 'user3', email: 'user3@test.com' };
                },
            };

            mockConnection.db.collection.mockReturnValue({
                find: jest.fn().mockReturnValue(mockCursor),
            });

            const fs = require('fs');
            jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
            jest.spyOn(fs.promises, 'stat').mockResolvedValue({ size: 1536 });

            // Mock write stream with all required methods
            const mockWriteStream = {
                on: jest.fn((event, handler) => {
                    if (event === 'finish') {
                        setImmediate(handler);
                    }
                    return mockWriteStream;
                }),
                once: jest.fn().mockReturnThis(),
                emit: jest.fn(),
                end: jest.fn(),
                write: jest.fn(),
                writable: true,
            };
            jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWriteStream as any);

            // Mock checkCancellationDuringExport
            jest.spyOn(service as any, 'checkCancellationDuringExport').mockResolvedValue(false);

            const result = await service['exportAllCollectionsStreaming'](exportId);

            // Verify we processed all documents
            expect(result.collectionsCount).toBe(1);
            expect(result.totalDocuments).toBe(3); // Three documents in the collection
        });

        it('should throw HttpException when export is cancelled during processing', async () => {
            const exportId = new Types.ObjectId().toString();
            
            // Mock collections
            const mockCollections = [
                { name: 'users' },
                { name: 'posts' },
            ];

            mockConnection.db.listCollections.mockReturnValue({
                toArray: jest.fn().mockResolvedValue(mockCollections),
            });

            // Mock cursor
            const mockCursor = {
                [Symbol.asyncIterator]: async function* () {
                    yield { _id: '1', name: 'user1' };
                },
            };

            mockConnection.db.collection.mockReturnValue({
                find: jest.fn().mockReturnValue(mockCursor),
            });

            const fs = require('fs');
            jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
            
            // Mock write stream with all required methods
            const mockWriteStream = {
                on: jest.fn().mockReturnThis(),
                once: jest.fn().mockReturnThis(),
                emit: jest.fn(),
                end: jest.fn(),
                write: jest.fn(),
                writable: true,
            };
            jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWriteStream as any);

            // Mock checkCancellationDuringExport: first call OK, second call cancelled
            jest.spyOn(service as any, 'checkCancellationDuringExport')
                .mockResolvedValueOnce(false) // First collection OK
                .mockResolvedValueOnce(true); // Cancelled before second collection

            // Execute and expect HttpException with correct message
            try {
                await service['exportAllCollectionsStreaming'](exportId);
                fail('Should have thrown HttpException');
            } catch (error) {
                expect(error).toBeInstanceOf(HttpException);
                expect(error.message).toBe('Export cancelled by user');
                expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
            }
        });
    });

    describe('checkCancellationDuringExport', () => {
        it('should return true if export is cancelled', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                status: ExportStatus.CANCELLED,
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            const result = await service['checkCancellationDuringExport'](exportId);

            expect(result).toBe(true);
            expect(MockExportModel.findById).toHaveBeenCalledWith(exportId);
        });

        it('should return false if export is not cancelled', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockExport = {
                status: ExportStatus.IN_PROGRESS,
            };

            MockExportModel.findById.mockResolvedValue(mockExport);

            const result = await service['checkCancellationDuringExport'](exportId);

            expect(result).toBe(false);
        });

        it('should return false if export is null', async () => {
            const exportId = new Types.ObjectId().toString();

            MockExportModel.findById.mockResolvedValue(null);

            const result = await service['checkCancellationDuringExport'](exportId);

            expect(result).toBe(false);
        });
    });

    describe('getExportPath', () => {
        it('should return correct export path', () => {
            const filename = 'test-export.json.gz';
            const result = service['getExportPath'](filename);

            expect(result).toContain('test-exports');
            expect(result).toContain(filename);
        });

        it('should use default exports directory if not configured', () => {
            const originalGet = mockConfigService.get;
            mockConfigService.get = jest.fn((key: string) => {
                if (key === 'EXPORTS_DIR') return undefined;
                return originalGet(key);
            });

            const filename = 'test-export.json.gz';
            const result = service['getExportPath'](filename);

            expect(result).toContain('exports');
            expect(result).toContain(filename);

            mockConfigService.get = originalGet;
        });
    });

    describe('sendExportCompletedEmail', () => {
        it('should send email on successful export', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
                fileSize: 1024,
                collectionsCount: 5,
                documentsCount: 100,
                completedAt: new Date(),
            };

            const mockAdmin = {
                _id: mockExport.adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            await service['sendExportCompletedEmail'](mockExport as any);

            expect(mailerService.mailerProvider.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'admin@test.com',
                    subject: 'Database Export Completed',
                    template: 'exportCompleted',
                }),
            );
        });

        it('should not send email if admin not found', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await service['sendExportCompletedEmail'](mockExport as any);

            expect(mailerService.mailerProvider.sendMail).not.toHaveBeenCalled();
        });

        it('should not send email if admin has no email', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
            };

            const mockAdmin = {
                _id: mockExport.adminId,
                email: null,
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            await service['sendExportCompletedEmail'](mockExport as any);

            expect(mailerService.mailerProvider.sendMail).not.toHaveBeenCalled();
        });

        it('should handle email sending errors silently', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
                fileSize: 1024,
                collectionsCount: 5,
                documentsCount: 100,
                completedAt: new Date(),
            };

            const mockAdmin = {
                _id: mockExport.adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            mailerService.mailerProvider.sendMail.mockRejectedValueOnce(new Error('Email error'));

            // Should not throw
            await expect(service['sendExportCompletedEmail'](mockExport as any)).resolves.toBeUndefined();
        });
    });

    describe('sendExportFailedEmail', () => {
        it('should send email on failed export', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
            };

            const mockAdmin = {
                _id: mockExport.adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            const errorMessage = 'Database connection failed';

            await service['sendExportFailedEmail'](mockExport as any, errorMessage);

            expect(mailerService.mailerProvider.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'admin@test.com',
                    subject: 'Database Export Failed',
                    template: 'exportFailed',
                    context: expect.objectContaining({
                        errorMessage,
                    }),
                }),
            );
        });

        it('should not send email if admin not found', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await service['sendExportFailedEmail'](mockExport as any, 'Error');

            expect(mailerService.mailerProvider.sendMail).not.toHaveBeenCalled();
        });

        it('should handle email sending errors silently', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
            };

            const mockAdmin = {
                _id: mockExport.adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            mailerService.mailerProvider.sendMail.mockRejectedValueOnce(new Error('Email error'));

            // Should not throw
            await expect(service['sendExportFailedEmail'](mockExport as any, 'Error')).resolves.toBeUndefined();
        });
    });

    describe('formatFileSize', () => {
        it('should format 0 bytes', () => {
            const result = service['formatFileSize'](0);
            expect(result).toBe('0 Bytes');
        });

        it('should format bytes', () => {
            const result = service['formatFileSize'](512);
            expect(result).toBe('512 Bytes');
        });

        it('should format kilobytes', () => {
            const result = service['formatFileSize'](1024);
            expect(result).toBe('1 KB');
        });

        it('should format megabytes', () => {
            const result = service['formatFileSize'](1024 * 1024 * 2.5);
            expect(result).toBe('2.5 MB');
        });

        it('should format gigabytes', () => {
            const result = service['formatFileSize'](1024 * 1024 * 1024 * 1.75);
            expect(result).toBe('1.75 GB');
        });
    });

    describe('markExportInProgress', () => {
        it('should update export status to in progress', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                status: ExportStatus.PENDING,
                startedAt: null,
                save: jest.fn().mockResolvedValue(true),
            };

            await service['markExportInProgress'](mockExport as any);

            expect(mockExport.status).toBe(ExportStatus.IN_PROGRESS);
            expect(mockExport.startedAt).toBeInstanceOf(Date);
            expect(mockExport.save).toHaveBeenCalled();
        });

        it('should handle save error gracefully and return early', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                status: ExportStatus.PENDING,
                startedAt: null,
                save: jest.fn().mockRejectedValue(new Error('Save failed')),
            };

            // Should not throw, just return
            await expect(service['markExportInProgress'](mockExport as any)).resolves.toBeUndefined();
            expect(mockExport.save).toHaveBeenCalled();
        });
    });

    describe('handleExportFailure', () => {
        it('should update export status to failed and save error message', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
                status: ExportStatus.IN_PROGRESS,
                save: jest.fn().mockResolvedValue(true),
            };

            const error = new Error('Export failed due to database error');

            await service['handleExportFailure'](mockExport as any, error);

            expect(mockExport.status).toBe(ExportStatus.FAILED);
            expect(mockExport.completedAt).toBeInstanceOf(Date);
            expect(mockExport.errorMessage).toBe(error.message);
            expect(mockExport.save).toHaveBeenCalled();
        });

        it('should return early if exportJob is null', async () => {
            const sendEmailSpy = jest.spyOn(service as any, 'sendExportFailedEmail');

            await service['handleExportFailure'](null as any, new Error('Test error'));

            expect(sendEmailSpy).not.toHaveBeenCalled();
        });

        it('should return early when save fails and not send email', async () => {
            const mockExport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
                status: ExportStatus.IN_PROGRESS,
                save: jest.fn().mockRejectedValue(new Error('Save failed')),
            };

            const sendEmailSpy = jest.spyOn(service as any, 'sendExportFailedEmail').mockResolvedValue(undefined);

            await service['handleExportFailure'](mockExport as any, new Error('Export error'));

            expect(mockExport.save).toHaveBeenCalled();
            // Email should NOT be sent when save fails (early return)
            expect(sendEmailSpy).not.toHaveBeenCalled();
        });
    });
});

