import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../../../src/admin/admin.controller';
import { AdminService } from '../../../src/admin/admin.service';
import { CreateExportDto, ExportFormat } from '../../../src/admin/dto/createExportDto';
import { CreateImportDto } from '../../../src/admin/dto/createImportDto';
import { ExportStatus } from '../../../src/admin/database-export.schema';
import { ImportStatus } from '../../../src/admin/database-import.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { Readable } from 'stream';
import type { Request, Response } from 'express';

describe('AdminController', () => {
    let controller: AdminController;
    let service: AdminService;

    const mockAdminService = {
        initiateExport: jest.fn(),
        getExportStatus: jest.fn(),
        cancelExport: jest.fn(),
        downloadExport: jest.fn(),
        initiateImport: jest.fn(),
        getImportStatus: jest.fn(),
        cancelImport: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                {
                    provide: AdminService,
                    useValue: mockAdminService,
                },
            ],
        })
            .overrideGuard(require('../../../src/auth/auth.guard').AuthGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .overrideGuard(require('../../../src/common/roles/roles.guard').RolesGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .compile();

        controller = module.get<AdminController>(AdminController);
        service = module.get<AdminService>(AdminService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createExport', () => {
        it('should initiate an export and return response DTO', async () => {
            const adminId = new Types.ObjectId();
            const dto: CreateExportDto = { format: ExportFormat.JSON };
            const mockRequest = {
                user: { _id: adminId },
            } as any;

            const mockExportJob = {
                _id: new Types.ObjectId(),
                status: ExportStatus.PENDING,
            };

            mockAdminService.initiateExport.mockResolvedValue(mockExportJob);

            const result = await controller.createExport(dto, mockRequest);

            expect(result).toEqual({
                message: 'Export initiated. You will receive an email when the export is complete.',
                exportId: mockExportJob._id.toString(),
                status: ExportStatus.PENDING,
            });
            expect(service.initiateExport).toHaveBeenCalledWith(adminId.toString(), dto);
        });
    });

    describe('getExportStatus', () => {
        it('should return export status', async () => {
            const exportId = new Types.ObjectId();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.COMPLETED,
                fileUrl: '/api/admin/export/123/download',
                fileSize: 1024,
                collectionsCount: 10,
                documentsCount: 100,
                startedAt: new Date(),
                completedAt: new Date(),
            };

            mockAdminService.getExportStatus.mockResolvedValue(mockExport);

            const result = await controller.getExportStatus(exportId.toString());

            expect(result).toEqual({
                exportId: exportId.toString(),
                status: ExportStatus.COMPLETED,
                fileUrl: mockExport.fileUrl,
                fileSize: mockExport.fileSize,
                collectionsCount: mockExport.collectionsCount,
                documentsCount: mockExport.documentsCount,
                startedAt: mockExport.startedAt,
                completedAt: mockExport.completedAt,
                errorMessage: undefined,
            });
            expect(service.getExportStatus).toHaveBeenCalledWith(exportId.toString());
        });

        it('should throw HttpException if export not found', async () => {
            mockAdminService.getExportStatus.mockResolvedValue(null);

            await expect(controller.getExportStatus('nonexistent')).rejects.toThrow(
                new HttpException('Export not found', HttpStatus.NOT_FOUND),
            );
        });

        it('should include error message if export failed', async () => {
            const exportId = new Types.ObjectId();
            const mockExport = {
                _id: exportId,
                status: ExportStatus.FAILED,
                errorMessage: 'Database connection failed',
                startedAt: new Date(),
                completedAt: new Date(),
            };

            mockAdminService.getExportStatus.mockResolvedValue(mockExport);

            const result = await controller.getExportStatus(exportId.toString());

            expect(result.status).toBe(ExportStatus.FAILED);
            expect(result.errorMessage).toBe('Database connection failed');
        });
    });

    describe('cancelExport', () => {
        it('should cancel an export successfully', async () => {
            const exportId = new Types.ObjectId().toString();

            mockAdminService.cancelExport.mockResolvedValue(true);

            const result = await controller.cancelExport(exportId);

            expect(result).toEqual({
                message: 'Export cancelled successfully',
                exportId,
            });
            expect(service.cancelExport).toHaveBeenCalledWith(exportId);
        });

        it('should throw HttpException if export cannot be cancelled', async () => {
            const exportId = new Types.ObjectId().toString();

            mockAdminService.cancelExport.mockResolvedValue(false);

            await expect(controller.cancelExport(exportId)).rejects.toThrow(
                new HttpException('Export cannot be cancelled or does not exist', HttpStatus.BAD_REQUEST),
            );
        });

        it('should throw HttpException if export not found', async () => {
            mockAdminService.cancelExport.mockResolvedValue(false);

            await expect(controller.cancelExport('nonexistent')).rejects.toThrow(HttpException);
        });
    });

    describe('downloadExport', () => {
        it('should download export file', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockStream = new Readable();
            const mockResponse = {
                set: jest.fn(),
            } as unknown as Response;

            mockAdminService.downloadExport.mockResolvedValue({
                stream: mockStream,
                filename: 'database-export-2026-02-04.json.gz',
                mimeType: 'application/gzip',
            });

            const result = await controller.downloadExport(exportId, mockResponse);

            expect(mockResponse.set).toHaveBeenCalledWith({
                'Content-Type': 'application/gzip',
                'Content-Disposition': 'attachment; filename="database-export-2026-02-04.json.gz"',
            });
            expect(result).toBeDefined();
            expect(service.downloadExport).toHaveBeenCalledWith(exportId);
        });

        it('should handle download errors', async () => {
            const exportId = new Types.ObjectId().toString();
            const mockResponse = {
                set: jest.fn(),
            } as unknown as Response;

            mockAdminService.downloadExport.mockRejectedValue(
                new HttpException('Export file not found', HttpStatus.NOT_FOUND),
            );

            await expect(controller.downloadExport(exportId, mockResponse)).rejects.toThrow(HttpException);
        });
    });

    // ========== IMPORT TESTS ==========

    describe('createImport', () => {
        it('should initiate an import and return response DTO', async () => {
            const adminId = new Types.ObjectId();
            const dto: CreateImportDto = { clearExisting: false };
            const mockRequest = {
                user: { _id: adminId },
            } as any;

            const mockFile = {
                buffer: Buffer.from('test data'),
                originalname: 'database-backup.json.gz',
            } as Express.Multer.File;

            const mockImportJob = {
                _id: new Types.ObjectId(),
                status: ImportStatus.PENDING,
            };

            mockAdminService.initiateImport.mockResolvedValue(mockImportJob);

            const result = await controller.createImport(mockFile, dto, mockRequest);

            expect(result).toEqual({
                message: 'Import initiated. You will receive an email when the import is complete.',
                importId: mockImportJob._id.toString(),
                status: ImportStatus.PENDING,
            });
            expect(service.initiateImport).toHaveBeenCalledWith(
                adminId.toString(),
                mockFile.buffer,
                mockFile.originalname,
                dto,
            );
        });

        it('should handle clearExisting parameter', async () => {
            const adminId = new Types.ObjectId();
            const dto: CreateImportDto = { clearExisting: true };
            const mockRequest = {
                user: { _id: adminId },
            } as any;

            const mockFile = {
                buffer: Buffer.from('test data'),
                originalname: 'database-backup.json.gz',
            } as Express.Multer.File;

            const mockImportJob = {
                _id: new Types.ObjectId(),
                status: ImportStatus.PENDING,
            };

            mockAdminService.initiateImport.mockResolvedValue(mockImportJob);

            await controller.createImport(mockFile, dto, mockRequest);

            expect(service.initiateImport).toHaveBeenCalledWith(
                adminId.toString(),
                mockFile.buffer,
                mockFile.originalname,
                dto,
            );
        });
    });

    describe('getImportStatus', () => {
        it('should return import status', async () => {
            const importId = new Types.ObjectId();
            const mockImport = {
                _id: importId,
                status: ImportStatus.COMPLETED,
                filename: 'database-backup.json.gz',
                fileSize: 2048,
                collectionsCount: 15,
                documentsCount: 2500,
                startedAt: new Date(),
                completedAt: new Date(),
            };

            mockAdminService.getImportStatus.mockResolvedValue(mockImport);

            const result = await controller.getImportStatus(importId.toString());

            expect(result).toEqual({
                importId: importId.toString(),
                status: ImportStatus.COMPLETED,
                filename: mockImport.filename,
                fileSize: mockImport.fileSize,
                collectionsCount: mockImport.collectionsCount,
                documentsCount: mockImport.documentsCount,
                startedAt: mockImport.startedAt,
                completedAt: mockImport.completedAt,
                errorMessage: undefined,
            });
            expect(service.getImportStatus).toHaveBeenCalledWith(importId.toString());
        });

        it('should throw HttpException if import not found', async () => {
            mockAdminService.getImportStatus.mockResolvedValue(null);

            await expect(controller.getImportStatus('nonexistent')).rejects.toThrow(
                new HttpException('Import not found', HttpStatus.NOT_FOUND),
            );
        });

        it('should include error message if import failed', async () => {
            const importId = new Types.ObjectId();
            const mockImport = {
                _id: importId,
                status: ImportStatus.FAILED,
                errorMessage: 'Invalid JSON format in import file',
                startedAt: new Date(),
                completedAt: new Date(),
            };

            mockAdminService.getImportStatus.mockResolvedValue(mockImport);

            const result = await controller.getImportStatus(importId.toString());

            expect(result.status).toBe(ImportStatus.FAILED);
            expect(result.errorMessage).toBe('Invalid JSON format in import file');
        });
    });

    describe('cancelImport', () => {
        it('should cancel an import successfully', async () => {
            const importId = new Types.ObjectId().toString();

            mockAdminService.cancelImport.mockResolvedValue(true);

            const result = await controller.cancelImport(importId);

            expect(result).toEqual({
                message: 'Import cancelled successfully',
                importId,
            });
            expect(service.cancelImport).toHaveBeenCalledWith(importId);
        });

        it('should throw HttpException if import cannot be cancelled', async () => {
            const importId = new Types.ObjectId().toString();

            mockAdminService.cancelImport.mockResolvedValue(false);

            await expect(controller.cancelImport(importId)).rejects.toThrow(
                new HttpException('Import cannot be cancelled or does not exist', HttpStatus.BAD_REQUEST),
            );
        });

        it('should throw HttpException if import not found', async () => {
            mockAdminService.cancelImport.mockResolvedValue(false);

            await expect(controller.cancelImport('nonexistent')).rejects.toThrow(HttpException);
        });
    });
});
