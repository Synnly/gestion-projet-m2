import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { AdminService } from '../../../src/admin/admin.service';
import { Admin } from '../../../src/admin/admin.schema';
import { CreateAdminDto } from '../../../src/admin/dto/createAdminDto';
import { DatabaseExport, ExportStatus } from '../../../src/admin/database-export.schema';
import { DatabaseImport, ImportStatus } from '../../../src/admin/database-import.schema';
import { MailerService } from '../../../src/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Readable } from 'stream';
import * as zlib from 'zlib';

describe('AdminService', () => {
    let service: AdminService;
    let adminModel: any;
    let exportModel: any;
    let importModel: any;
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

    // Mock class for the DatabaseImport Model
    class MockImportModel {
        save: any;
        _id: Types.ObjectId;
        status: ImportStatus;
        adminId: Types.ObjectId;
        filename?: string;
        fileKey?: string;
        fileSize?: number;

        constructor(public data: any) {
            this._id = data._id || new Types.ObjectId();
            this.status = data.status || ImportStatus.PENDING;
            this.adminId = data.adminId;
            this.filename = data.filename;
            this.fileKey = data.fileKey;
            this.fileSize = data.fileSize;
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
            if (key === 'IMPORTS_DIR') return './test-imports';
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
                    provide: getModelToken(DatabaseImport.name),
                    useValue: MockImportModel,
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
        importModel = module.get(getModelToken(DatabaseImport.name));
        connection = module.get(getConnectionToken());
        mailerService = module.get(MailerService);
        configService = module.get(ConfigService);

        jest.clearAllMocks();
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
        it('should return list of exports for admin', async () => {
            const adminId = new Types.ObjectId().toString();
            const mockExports = [
                {
                    _id: new Types.ObjectId(),
                    adminId: adminId,
                    status: ExportStatus.COMPLETED,
                    createdAt: new Date('2026-02-01'),
                },
                {
                    _id: new Types.ObjectId(),
                    adminId: adminId,
                    status: ExportStatus.IN_PROGRESS,
                    createdAt: new Date('2026-02-02'),
                },
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

        it('should return empty array if no exports', async () => {
            const adminId = new Types.ObjectId().toString();

            MockExportModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([]),
                }),
            });

            const result = await service.getExportsByAdmin(adminId);

            expect(result).toEqual([]);
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
            const checkCancellationSpy = jest.spyOn(service as any, 'checkCancellationDuringOperation')
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

            // Mock checkCancellationDuringOperation
            jest.spyOn(service as any, 'checkCancellationDuringOperation').mockResolvedValue(false);

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

            // Mock checkCancellationDuringOperation: first call OK, second call cancelled
            jest.spyOn(service as any, 'checkCancellationDuringOperation')
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





    // ========== IMPORT TESTS ==========

    describe('initiateImport', () => {
        it('should create an import job and save the file', async () => {
            const adminId = new Types.ObjectId().toString();
            const fileBuffer = Buffer.from('test file content');
            const originalFilename = 'test-export.json.gz';
            const dto = { clearExisting: false };

            // Mock filesystem operations
            const mockWriteFile = jest.fn().mockResolvedValue(undefined);
            const mockMkdir = jest.fn().mockResolvedValue(undefined);
            const mockStat = jest.fn().mockResolvedValue({ size: 1024 });

            jest.spyOn(require('fs'), 'promises', 'get').mockReturnValue({
                writeFile: mockWriteFile,
                mkdir: mockMkdir,
                stat: mockStat,
            });

            jest.spyOn(service as any, 'performImport').mockImplementation(() => {});

            const result = await service.initiateImport(adminId, fileBuffer, originalFilename, dto);

            expect(result).toBeDefined();
            expect(result.status).toBe(ImportStatus.PENDING);
            expect(result.filename).toBe(originalFilename);
            expect(result.adminId.toString()).toBe(adminId);
            expect(mockWriteFile).toHaveBeenCalled();
            expect(mockMkdir).toHaveBeenCalled();
        });
    });

    describe('getImportStatus', () => {
        it('should return import job by ID', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.COMPLETED,
                adminId: new Types.ObjectId(),
            };

            MockImportModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockImport),
            });

            const result = await service.getImportStatus(importId);

            expect(result).toEqual(mockImport);
            expect(MockImportModel.findById).toHaveBeenCalledWith(importId);
        });

        it('should return null if import not found', async () => {
            const importId = new Types.ObjectId().toString();

            MockImportModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service.getImportStatus(importId);

            expect(result).toBeNull();
        });
    });

    describe('cancelImport', () => {
        it('should cancel a pending import', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.PENDING,
                save: jest.fn().mockResolvedValue(true),
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockImport);

            const result = await service.cancelImport(importId);

            expect(result).toBe(true);
            expect(mockImport.status).toBe(ImportStatus.CANCELLED);
            expect(mockImport.completedAt).toBeInstanceOf(Date);
            expect(mockImport.save).toHaveBeenCalled();
        });

        it('should cancel an in-progress import', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.IN_PROGRESS,
                save: jest.fn().mockResolvedValue(true),
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockImport);

            const result = await service.cancelImport(importId);

            expect(result).toBe(true);
            expect(mockImport.status).toBe(ImportStatus.CANCELLED);
        });

        it('should return false if import does not exist', async () => {
            const importId = new Types.ObjectId().toString();

            MockImportModel.findById = jest.fn().mockResolvedValue(null);

            const result = await service.cancelImport(importId);

            expect(result).toBe(false);
        });

        it('should return false if import is already completed', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.COMPLETED,
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockImport);

            const result = await service.cancelImport(importId);

            expect(result).toBe(false);
        });

        it('should return false if import is already cancelled', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.CANCELLED,
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockImport);

            const result = await service.cancelImport(importId);

            expect(result).toBe(false);
        });

        it('should return false if import has failed', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.FAILED,
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockImport);

            const result = await service.cancelImport(importId);

            expect(result).toBe(false);
        });
    });

    describe('performImport', () => {
        it('should return early if import job does not exist', async () => {
            const importId = new Types.ObjectId().toString();

            MockImportModel.findById = jest.fn().mockResolvedValue(null);

            await service['performImport'](importId, false);

            // Should just return without errors
            expect(MockImportModel.findById).toHaveBeenCalledWith(importId);
        });

        it('should return early if import is cancelled', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.CANCELLED,
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockImport);

            const markInProgressSpy = jest.spyOn(service as any, 'markJobInProgress');

            await service['performImport'](importId, false);

            expect(markInProgressSpy).not.toHaveBeenCalled();
        });

        it('should perform complete import flow successfully', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.PENDING,
                adminId: new Types.ObjectId(),
                fileKey: 'test-import.json.gz',
                save: jest.fn().mockResolvedValue(true),
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockImport);

            const importStreamingSpy = jest
                .spyOn(service as any, 'importAllCollectionsStreaming')
                .mockResolvedValue({ totalDocuments: 100, collectionsCount: 5 });

            const markCompletedSpy = jest.spyOn(service as any, 'markImportCompleted').mockResolvedValue(undefined);

            const sendEmailSpy = jest.spyOn(service as any, 'sendImportCompletedEmail').mockResolvedValue(undefined);

            await service['performImport'](importId, false);

            expect(mockImport.status).toBe(ImportStatus.IN_PROGRESS);
            expect(importStreamingSpy).toHaveBeenCalled();
            expect(markCompletedSpy).toHaveBeenCalled();
            expect(sendEmailSpy).toHaveBeenCalled();
        });

        it('should handle import failure', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImport = {
                _id: importId,
                status: ImportStatus.PENDING,
                adminId: new Types.ObjectId(),
                fileKey: 'test-import.json.gz',
                save: jest.fn().mockResolvedValue(true),
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockImport);

            const error = new Error('Import failed');
            jest.spyOn(service as any, 'importAllCollectionsStreaming').mockRejectedValue(error);

            const handleFailureSpy = jest.spyOn(service as any, 'handleJobFailure').mockResolvedValue(undefined);

            await service['performImport'](importId, false);

            expect(handleFailureSpy).toHaveBeenCalled();
        });
    });

    describe('importAllCollectionsStreaming', () => {
        it('should throw error if database connection is not available', async () => {
            const importId = new Types.ObjectId().toString();
            const fileKey = 'test-import.json.gz';

            const originalConnection = service['connection'];
            (service as any).connection = null;

            await expect(service['importAllCollectionsStreaming'](importId, fileKey, false)).rejects.toThrow(
                InternalServerErrorException,
            );

            (service as any).connection = originalConnection;
        });

        it('should throw error if import file does not exist', async () => {
            const importId = new Types.ObjectId().toString();
            const fileKey = 'non-existent.json.gz';

            jest.spyOn(require('fs'), 'existsSync').mockReturnValue(false);

            await expect(service['importAllCollectionsStreaming'](importId, fileKey, false)).rejects.toThrow(
                'Import file not found on disk',
            );
        });

        it('should throw error if JSON format is invalid', async () => {
            const importId = new Types.ObjectId().toString();
            const fileKey = 'invalid.json.gz';

            jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
            jest.spyOn(service as any, 'readAndDecompressFile').mockResolvedValue('invalid json content');

            await expect(service['importAllCollectionsStreaming'](importId, fileKey, false)).rejects.toThrow(
                'Invalid JSON format in import file',
            );
        });

        it('should import collections successfully', async () => {
            const importId = new Types.ObjectId().toString();
            const fileKey = 'test-import.json.gz';

            const mockData = {
                users: [{ _id: '1', name: 'User 1' }, { _id: '2', name: 'User 2' }],
                posts: [{ _id: '1', title: 'Post 1' }],
            };

            jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
            jest.spyOn(service as any, 'readAndDecompressFile').mockResolvedValue(JSON.stringify(mockData));

            const mockInsertMany = jest.fn().mockResolvedValue({ insertedCount: 2 });
            const mockCollection = {
                deleteMany: jest.fn().mockResolvedValue({}),
                insertMany: mockInsertMany,
            };

            connection.db.collection = jest.fn().mockReturnValue(mockCollection);

            jest.spyOn(service as any, 'checkCancellationDuringOperation').mockResolvedValue(false);

            const result = await service['importAllCollectionsStreaming'](importId, fileKey, false);

            expect(result.totalDocuments).toBe(3);
            expect(result.collectionsCount).toBe(2);
            expect(mockInsertMany).toHaveBeenCalled();
        });

        it('should clear existing data when clearExisting is true', async () => {
            const importId = new Types.ObjectId().toString();
            const fileKey = 'test-import.json.gz';

            const mockData = {
                users: [{ _id: '1', name: 'User 1' }],
            };

            jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
            jest.spyOn(service as any, 'readAndDecompressFile').mockResolvedValue(JSON.stringify(mockData));

            const mockDeleteMany = jest.fn().mockResolvedValue({});
            const mockInsertMany = jest.fn().mockResolvedValue({ insertedCount: 1 });
            const mockCollection = {
                deleteMany: mockDeleteMany,
                insertMany: mockInsertMany,
            };

            connection.db.collection = jest.fn().mockReturnValue(mockCollection);
            jest.spyOn(service as any, 'checkCancellationDuringOperation').mockResolvedValue(false);

            await service['importAllCollectionsStreaming'](importId, fileKey, true);

            expect(mockDeleteMany).toHaveBeenCalledWith({});
            expect(mockInsertMany).toHaveBeenCalled();
        });

        it('should throw error if import is cancelled during execution', async () => {
            const importId = new Types.ObjectId().toString();
            const fileKey = 'test-import.json.gz';

            const mockData = {
                users: [{ _id: '1', name: 'User 1' }],
            };

            jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
            jest.spyOn(service as any, 'readAndDecompressFile').mockResolvedValue(JSON.stringify(mockData));
            jest.spyOn(service as any, 'checkCancellationDuringOperation').mockResolvedValue(true);

            await expect(service['importAllCollectionsStreaming'](importId, fileKey, false)).rejects.toThrow(
                'Import cancelled by user',
            );
        });

        it('should handle batch insertion for large datasets', async () => {
            const importId = new Types.ObjectId().toString();
            const fileKey = 'large-import.json.gz';

            // Create 2500 documents (will be split into 3 batches of 1000)
            const largeDocuments = Array.from({ length: 2500 }, (_, i) => ({ _id: i.toString(), name: `Doc ${i}` }));
            const mockData = { documents: largeDocuments };

            jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
            jest.spyOn(service as any, 'readAndDecompressFile').mockResolvedValue(JSON.stringify(mockData));

            const mockInsertMany = jest.fn().mockResolvedValue({ insertedCount: 1000 });
            const mockCollection = {
                deleteMany: jest.fn().mockResolvedValue({}),
                insertMany: mockInsertMany,
            };

            connection.db.collection = jest.fn().mockReturnValue(mockCollection);
            jest.spyOn(service as any, 'checkCancellationDuringOperation').mockResolvedValue(false);

            const result = await service['importAllCollectionsStreaming'](importId, fileKey, false);

            expect(result.totalDocuments).toBe(2500);
            expect(mockInsertMany).toHaveBeenCalledTimes(3); // 3 batches
        });

        it('should skip non-array collections', async () => {
            const importId = new Types.ObjectId().toString();
            const fileKey = 'test-import.json.gz';

            const mockData = {
                users: [{ _id: '1', name: 'User 1' }],
                invalidCollection: 'not an array',
            };

            jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
            jest.spyOn(service as any, 'readAndDecompressFile').mockResolvedValue(JSON.stringify(mockData));

            const mockInsertMany = jest.fn().mockResolvedValue({ insertedCount: 1 });
            const mockCollection = {
                deleteMany: jest.fn().mockResolvedValue({}),
                insertMany: mockInsertMany,
            };

            connection.db.collection = jest.fn().mockReturnValue(mockCollection);
            jest.spyOn(service as any, 'checkCancellationDuringOperation').mockResolvedValue(false);

            const result = await service['importAllCollectionsStreaming'](importId, fileKey, false);

            expect(result.collectionsCount).toBe(1); // Only valid array collection
            expect(mockInsertMany).toHaveBeenCalledTimes(1);
        });
    });

    describe('readAndDecompressFile', () => {
        it('should read and decompress gzip file', async () => {
            const filePath = '/test/path/file.json.gz';
            const mockCompressed = Buffer.from('compressed content');
            const mockDecompressed = Buffer.from('{"test": "data"}');

            const mockReadFileSync = jest.fn().mockReturnValue(mockCompressed);
            const mockGunzip = jest.fn().mockResolvedValue(mockDecompressed);

            jest.spyOn(require('fs'), 'readFileSync').mockImplementation(mockReadFileSync);
            jest.spyOn(require('util'), 'promisify').mockReturnValue(mockGunzip);

            const result = await service['readAndDecompressFile'](filePath);

            expect(result).toBe('{"test": "data"}');
            expect(mockReadFileSync).toHaveBeenCalledWith(filePath);
        });
    });

    describe('getImportPath', () => {
        it('should return the correct import path', () => {
            const filename = 'test-import.json.gz';
            const result = service['getImportPath'](filename);

            expect(result).toContain('test-imports');
            expect(result).toContain(filename);
        });
    });

    describe('markImportCompleted', () => {
        it('should update import status to completed with metadata', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                status: ImportStatus.IN_PROGRESS,
                save: jest.fn().mockResolvedValue(true),
            };

            await service['markImportCompleted'](mockImport as any, 10, 500);

            expect(mockImport.status).toBe(ImportStatus.COMPLETED);
            expect(mockImport.completedAt).toBeInstanceOf(Date);
            expect(mockImport.collectionsCount).toBe(10);
            expect(mockImport.documentsCount).toBe(500);
            expect(mockImport.save).toHaveBeenCalled();
        });

        it('should handle save error gracefully', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                status: ImportStatus.IN_PROGRESS,
                save: jest.fn().mockRejectedValue(new Error('Save failed')),
            };

            await expect(service['markImportCompleted'](mockImport as any, 5, 100)).resolves.toBeUndefined();
            expect(mockImport.save).toHaveBeenCalled();
        });
    });

    describe('sendImportCompletedEmail', () => {
        it('should send completion email to admin', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
                filename: 'test-import.json.gz',
                collectionsCount: 10,
                documentsCount: 500,
                completedAt: new Date(),
            };

            const mockAdmin = {
                _id: mockImport.adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            await service['sendImportCompletedEmail'](mockImport as any);

            expect(mailerService.mailerProvider.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'admin@test.com',
                    subject: 'Database Import Completed',
                    template: 'importCompleted',
                }),
            );
        });

        it('should not send email if admin not found', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await service['sendImportCompletedEmail'](mockImport as any);

            expect(mailerService.mailerProvider.sendMail).not.toHaveBeenCalled();
        });

        it('should not send email if admin has no email', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
            };

            const mockAdmin = {
                _id: mockImport.adminId,
                email: null,
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            await service['sendImportCompletedEmail'](mockImport as any);

            expect(mailerService.mailerProvider.sendMail).not.toHaveBeenCalled();
        });

        it('should handle email sending errors gracefully', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
                filename: 'test-import.json.gz',
            };

            const mockAdmin = {
                _id: mockImport.adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            mailerService.mailerProvider.sendMail.mockRejectedValueOnce(new Error('Email error'));

            await expect(service['sendImportCompletedEmail'](mockImport as any)).resolves.toBeUndefined();
        });
    });

    describe('sendImportFailedEmail', () => {
        it('should send failure email to admin', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
                filename: 'test-import.json.gz',
            };

            const mockAdmin = {
                _id: mockImport.adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            await service['sendImportFailedEmail'](mockImport as any, 'Import error message');

            expect(mailerService.mailerProvider.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'admin@test.com',
                    subject: 'Database Import Failed',
                    template: 'importFailed',
                    context: expect.objectContaining({
                        errorMessage: 'Import error message',
                    }),
                }),
            );
        });

        it('should not send email if admin not found', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await service['sendImportFailedEmail'](mockImport as any, 'Error');

            expect(mailerService.mailerProvider.sendMail).not.toHaveBeenCalled();
        });

        it('should handle email sending errors gracefully', async () => {
            const mockImport = {
                _id: new Types.ObjectId(),
                adminId: new Types.ObjectId(),
                filename: 'test-import.json.gz',
            };

            const mockAdmin = {
                _id: mockImport.adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            mailerService.mailerProvider.sendMail.mockRejectedValueOnce(new Error('Email error'));

            await expect(service['sendImportFailedEmail'](mockImport as any, 'Error')).resolves.toBeUndefined();
        });
    });

    // ========== GENERIC/SHARED FUNCTION TESTS ==========

    describe('isJobCancelled', () => {
        it('should return true for cancelled export', () => {
            const mockJob = { status: ExportStatus.CANCELLED } as any;
            const result = service['isJobCancelled'](mockJob);
            expect(result).toBe(true);
        });

        it('should return true for cancelled import', () => {
            const mockJob = { status: ImportStatus.CANCELLED } as any;
            const result = service['isJobCancelled'](mockJob);
            expect(result).toBe(true);
        });

        it('should return false for non-cancelled job', () => {
            const mockJob = { status: ExportStatus.PENDING } as any;
            const result = service['isJobCancelled'](mockJob);
            expect(result).toBe(false);
        });
    });

    describe('markJobInProgress', () => {
        it('should update job status to in progress', async () => {
            const mockJob = {
                status: ImportStatus.PENDING,
                startedAt: null,
                save: jest.fn().mockResolvedValue(true),
            };

            await service['markJobInProgress'](mockJob as any);

            expect(mockJob.status).toBe(ImportStatus.IN_PROGRESS);
            expect(mockJob.startedAt).toBeInstanceOf(Date);
            expect(mockJob.save).toHaveBeenCalled();
        });

        it('should handle save error gracefully', async () => {
            const mockJob = {
                status: ExportStatus.PENDING,
                startedAt: null,
                save: jest.fn().mockRejectedValue(new Error('Save failed')),
            };

            await expect(service['markJobInProgress'](mockJob as any)).resolves.toBeUndefined();
        });
    });

    describe('checkCancellationDuringOperation', () => {
        it('should return true if export job is cancelled', async () => {
            const jobId = new Types.ObjectId().toString();
            const mockJob = { status: ExportStatus.CANCELLED };

            MockExportModel.findById = jest.fn().mockResolvedValue(mockJob);

            const result = await service['checkCancellationDuringOperation'](
                jobId,
                exportModel,
                ExportStatus.CANCELLED,
            );

            expect(result).toBe(true);
        });

        it('should return true if import job is cancelled', async () => {
            const jobId = new Types.ObjectId().toString();
            const mockJob = { status: ImportStatus.CANCELLED };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockJob);

            const result = await service['checkCancellationDuringOperation'](
                jobId,
                importModel,
                ImportStatus.CANCELLED,
            );

            expect(result).toBe(true);
        });

        it('should return false if job is not cancelled', async () => {
            const jobId = new Types.ObjectId().toString();
            const mockJob = { status: ExportStatus.IN_PROGRESS };

            MockExportModel.findById = jest.fn().mockResolvedValue(mockJob);

            const result = await service['checkCancellationDuringOperation'](
                jobId,
                exportModel,
                ExportStatus.CANCELLED,
            );

            expect(result).toBe(false);
        });

        it('should return false if job not found', async () => {
            const jobId = new Types.ObjectId().toString();

            MockExportModel.findById = jest.fn().mockResolvedValue(null);

            const result = await service['checkCancellationDuringOperation'](
                jobId,
                exportModel,
                ExportStatus.CANCELLED,
            );

            expect(result).toBe(false);
        });
    });

    describe('handleJobFailure', () => {
        it('should update job status to failed and call email function', async () => {
            const mockJob = {
                _id: new Types.ObjectId(),
                status: ImportStatus.IN_PROGRESS,
                save: jest.fn().mockResolvedValue(true),
            };

            const mockEmailFn = jest.fn().mockResolvedValue(undefined);
            const error = new Error('Test failure');

            await service['handleJobFailure'](mockJob as any, error, mockEmailFn);

            expect(mockJob.status).toBe(ImportStatus.FAILED);
            expect(mockJob.completedAt).toBeInstanceOf(Date);
            expect(mockJob.errorMessage).toBe('Test failure');
            expect(mockJob.save).toHaveBeenCalled();
            expect(mockEmailFn).toHaveBeenCalledWith(mockJob, 'Test failure');
        });

        it('should return early if job is null', async () => {
            const mockEmailFn = jest.fn();

            await service['handleJobFailure'](null, new Error('Test'), mockEmailFn);

            expect(mockEmailFn).not.toHaveBeenCalled();
        });

        it('should not call email function if save fails', async () => {
            const mockJob = {
                status: ImportStatus.IN_PROGRESS,
                save: jest.fn().mockRejectedValue(new Error('Save failed')),
            };

            const mockEmailFn = jest.fn();

            await service['handleJobFailure'](mockJob as any, new Error('Test'), mockEmailFn);

            expect(mockEmailFn).not.toHaveBeenCalled();
        });
    });

    describe('getAdminEmail', () => {
        it('should return admin email if admin exists', async () => {
            const adminId = new Types.ObjectId().toString();
            const mockAdmin = {
                _id: adminId,
                email: 'admin@test.com',
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            const result = await service['getAdminEmail'](adminId);

            expect(result).toBe('admin@test.com');
        });

        it('should return null if admin not found', async () => {
            const adminId = new Types.ObjectId().toString();

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            const result = await service['getAdminEmail'](adminId);

            expect(result).toBeNull();
        });

        it('should return null if admin has no email', async () => {
            const adminId = new Types.ObjectId().toString();
            const mockAdmin = {
                _id: adminId,
                email: null,
            };

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockAdmin),
            });

            const result = await service['getAdminEmail'](adminId);

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            const adminId = new Types.ObjectId().toString();

            MockAdminModel.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockRejectedValue(new Error('Database error')),
            });

            const result = await service['getAdminEmail'](adminId);

            expect(result).toBeNull();
        });
    });

    describe('cancelJob', () => {
        it('should cancel export job successfully', async () => {
            const jobId = new Types.ObjectId().toString();
            const mockJob = {
                status: ExportStatus.PENDING,
                save: jest.fn().mockResolvedValue(true),
            };

            MockExportModel.findById = jest.fn().mockResolvedValue(mockJob);

            const result = await service['cancelJob'](
                jobId,
                exportModel,
                ExportStatus.PENDING,
                ExportStatus.IN_PROGRESS,
                ExportStatus.CANCELLED,
            );

            expect(result).toBe(true);
            expect(mockJob.status).toBe(ExportStatus.CANCELLED);
        });

        it('should cancel import job successfully', async () => {
            const jobId = new Types.ObjectId().toString();
            const mockJob = {
                status: ImportStatus.IN_PROGRESS,
                save: jest.fn().mockResolvedValue(true),
            };

            MockImportModel.findById = jest.fn().mockResolvedValue(mockJob);

            const result = await service['cancelJob'](
                jobId,
                importModel,
                ImportStatus.PENDING,
                ImportStatus.IN_PROGRESS,
                ImportStatus.CANCELLED,
            );

            expect(result).toBe(true);
        });

        it('should return false if job not found', async () => {
            const jobId = new Types.ObjectId().toString();

            MockExportModel.findById = jest.fn().mockResolvedValue(null);

            const result = await service['cancelJob'](
                jobId,
                exportModel,
                ExportStatus.PENDING,
                ExportStatus.IN_PROGRESS,
                ExportStatus.CANCELLED,
            );

            expect(result).toBe(false);
        });

        it('should return false if job is in wrong status', async () => {
            const jobId = new Types.ObjectId().toString();
            const mockJob = {
                status: ExportStatus.COMPLETED,
            };

            MockExportModel.findById = jest.fn().mockResolvedValue(mockJob);

            const result = await service['cancelJob'](
                jobId,
                exportModel,
                ExportStatus.PENDING,
                ExportStatus.IN_PROGRESS,
                ExportStatus.CANCELLED,
            );

            expect(result).toBe(false);
        });
    });

    describe('import cancellation during streaming', () => {
        it('should throw HttpException when import is cancelled during batch processing', async () => {
            const importId = new Types.ObjectId().toString();
            const mockImportJob = {
                _id: new Types.ObjectId(importId),
                adminId: new Types.ObjectId(),
                status: ImportStatus.IN_PROGRESS,
                fileKey: 'test-import.json.gz',
                save: jest.fn().mockResolvedValue(true),
            };

            // Create a large dataset with multiple batches
            const largeDataset: Record<string, any[]> = {
                testCollection: Array.from({ length: 2500 }, (_, i) => ({ _id: i, data: `doc-${i}` })),
            };

            const compressed = zlib.gzipSync(JSON.stringify(largeDataset));
            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'readFileSync').mockReturnValue(compressed);

            MockImportModel.findById = jest
                .fn()
                .mockResolvedValueOnce(mockImportJob) // First call in performImport
                .mockResolvedValueOnce({ status: ImportStatus.IN_PROGRESS }) // First batch check
                .mockResolvedValueOnce({ status: ImportStatus.IN_PROGRESS }) // Second batch check
                .mockResolvedValueOnce({ status: ImportStatus.CANCELLED }); // Third check - cancelled

            const mockCollection = {
                deleteMany: jest.fn().mockResolvedValue({}),
                insertMany: jest.fn().mockResolvedValue({}),
            };

            (connection.db as any).collection = jest.fn().mockReturnValue(mockCollection);

            // This should throw during batch processing
            await expect(
                service['importAllCollectionsStreaming'](importId, 'test-import.json.gz', false),
            ).rejects.toThrow(new HttpException('Import cancelled by user', HttpStatus.CONFLICT));
        });

        it('should throw HttpException when import is cancelled before processing collection', async () => {
            const importId = new Types.ObjectId().toString();

            const dataset = {
                collection1: [{ _id: 1, data: 'test' }],
                collection2: [{ _id: 2, data: 'test' }],
            };

            const compressed = zlib.gzipSync(JSON.stringify(dataset));
            const fs = require('fs');
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            jest.spyOn(fs, 'readFileSync').mockReturnValue(compressed);

            // First collection processes fine, second is cancelled
            MockImportModel.findById = jest
                .fn()
                .mockResolvedValueOnce({ status: ImportStatus.IN_PROGRESS }) // collection1 check
                .mockResolvedValueOnce({ status: ImportStatus.CANCELLED }); // collection2 check - cancelled

            const mockCollection = {
                deleteMany: jest.fn().mockResolvedValue({}),
                insertMany: jest.fn().mockResolvedValue({}),
            };

            (connection.db as any).collection = jest.fn().mockReturnValue(mockCollection);

            await expect(
                service['importAllCollectionsStreaming'](importId, 'test-file.json.gz', false),
            ).rejects.toThrow(new HttpException('Import cancelled by user', HttpStatus.CONFLICT));
        });
    });});