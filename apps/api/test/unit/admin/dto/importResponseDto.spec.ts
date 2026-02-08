import {
    ImportInitiatedResponseDto,
    ImportStatusResponseDto,
    ImportListItemDto,
    ImportCancelledResponseDto,
} from '../../../../src/admin/dto/importResponseDto';
import { ImportStatus } from '../../../../src/admin/database-import.schema';

describe('ImportResponseDto', () => {
    describe('ImportInitiatedResponseDto', () => {
        it('should create a valid ImportInitiatedResponseDto', () => {
            const dto: ImportInitiatedResponseDto = {
                message: 'Import initiated. You will receive an email when the import is complete.',
                importId: '507f1f77bcf86cd799439011',
                status: ImportStatus.PENDING,
            };

            expect(dto).toBeDefined();
            expect(dto.message).toBe('Import initiated. You will receive an email when the import is complete.');
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ImportStatus.PENDING);
        });

        it('should have required properties', () => {
            const dto: ImportInitiatedResponseDto = {
                message: 'Import started',
                importId: '123456',
                status: ImportStatus.PENDING,
            };

            expect(dto).toHaveProperty('message');
            expect(dto).toHaveProperty('importId');
            expect(dto).toHaveProperty('status');
        });
    });

    describe('ImportStatusResponseDto', () => {
        it('should create a valid ImportStatusResponseDto with all properties', () => {
            const dto: ImportStatusResponseDto = {
                importId: '507f1f77bcf86cd799439011',
                status: ImportStatus.COMPLETED,
                filename: 'database-backup.json.gz',
                fileSize: 1048576,
                collectionsCount: 15,
                documentsCount: 2500,
                startedAt: new Date('2026-02-08T10:00:00Z'),
                completedAt: new Date('2026-02-08T10:05:00Z'),
            };

            expect(dto).toBeDefined();
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ImportStatus.COMPLETED);
            expect(dto.filename).toBe('database-backup.json.gz');
            expect(dto.fileSize).toBe(1048576);
            expect(dto.collectionsCount).toBe(15);
            expect(dto.documentsCount).toBe(2500);
            expect(dto.startedAt).toBeInstanceOf(Date);
            expect(dto.completedAt).toBeInstanceOf(Date);
        });

        it('should create a valid ImportStatusResponseDto with minimal properties', () => {
            const dto: ImportStatusResponseDto = {
                importId: '507f1f77bcf86cd799439011',
                status: ImportStatus.PENDING,
            };

            expect(dto).toBeDefined();
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ImportStatus.PENDING);
            expect(dto.filename).toBeUndefined();
            expect(dto.fileSize).toBeUndefined();
        });

        it('should include error message when import fails', () => {
            const dto: ImportStatusResponseDto = {
                importId: '507f1f77bcf86cd799439011',
                status: ImportStatus.FAILED,
                errorMessage: 'Invalid JSON format in import file',
                startedAt: new Date('2026-02-08T10:00:00Z'),
                completedAt: new Date('2026-02-08T10:01:00Z'),
            };

            expect(dto.status).toBe(ImportStatus.FAILED);
            expect(dto.errorMessage).toBe('Invalid JSON format in import file');
        });

        it('should support all import statuses', () => {
            const statuses = [
                ImportStatus.PENDING,
                ImportStatus.IN_PROGRESS,
                ImportStatus.COMPLETED,
                ImportStatus.FAILED,
                ImportStatus.CANCELLED,
            ];

            statuses.forEach((status) => {
                const dto: ImportStatusResponseDto = {
                    importId: '507f1f77bcf86cd799439011',
                    status,
                };

                expect(dto.status).toBe(status);
            });
        });
    });

    describe('ImportListItemDto', () => {
        it('should create a valid ImportListItemDto with all properties', () => {
            const createdAt = new Date('2026-02-08T09:00:00Z');
            const dto: ImportListItemDto = {
                importId: '507f1f77bcf86cd799439011',
                status: ImportStatus.COMPLETED,
                filename: 'database-backup.json.gz',
                fileSize: 2097152,
                collectionsCount: 20,
                documentsCount: 5000,
                startedAt: new Date('2026-02-08T10:00:00Z'),
                completedAt: new Date('2026-02-08T10:10:00Z'),
                createdAt,
            };

            expect(dto).toBeDefined();
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ImportStatus.COMPLETED);
            expect(dto.filename).toBe('database-backup.json.gz');
            expect(dto.fileSize).toBe(2097152);
            expect(dto.collectionsCount).toBe(20);
            expect(dto.documentsCount).toBe(5000);
            expect(dto.createdAt).toBe(createdAt);
        });

        it('should create a valid ImportListItemDto with minimal properties', () => {
            const createdAt = new Date('2026-02-08T09:00:00Z');
            const dto: ImportListItemDto = {
                importId: '507f1f77bcf86cd799439011',
                status: ImportStatus.PENDING,
                createdAt,
            };

            expect(dto).toBeDefined();
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ImportStatus.PENDING);
            expect(dto.createdAt).toBe(createdAt);
            expect(dto.filename).toBeUndefined();
        });

        it('should have required createdAt property', () => {
            const dto: ImportListItemDto = {
                importId: '507f1f77bcf86cd799439011',
                status: ImportStatus.IN_PROGRESS,
                createdAt: new Date(),
            };

            expect(dto).toHaveProperty('createdAt');
            expect(dto.createdAt).toBeInstanceOf(Date);
        });

        it('should support listing imports in different states', () => {
            const createdAt = new Date();
            const imports: ImportListItemDto[] = [
                {
                    importId: '1',
                    status: ImportStatus.COMPLETED,
                    collectionsCount: 10,
                    documentsCount: 1000,
                    createdAt,
                },
                {
                    importId: '2',
                    status: ImportStatus.IN_PROGRESS,
                    startedAt: new Date(),
                    createdAt,
                },
                {
                    importId: '3',
                    status: ImportStatus.FAILED,
                    completedAt: new Date(),
                    createdAt,
                },
            ];

            expect(imports).toHaveLength(3);
            expect(imports[0].status).toBe(ImportStatus.COMPLETED);
            expect(imports[1].status).toBe(ImportStatus.IN_PROGRESS);
            expect(imports[2].status).toBe(ImportStatus.FAILED);
        });
    });

    describe('ImportCancelledResponseDto', () => {
        it('should create a valid ImportCancelledResponseDto', () => {
            const dto: ImportCancelledResponseDto = {
                message: 'Import cancelled successfully',
                importId: '507f1f77bcf86cd799439011',
            };

            expect(dto).toBeDefined();
            expect(dto.message).toBe('Import cancelled successfully');
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
        });

        it('should have required properties', () => {
            const dto: ImportCancelledResponseDto = {
                message: 'Cancelled',
                importId: '123',
            };

            expect(dto).toHaveProperty('message');
            expect(dto).toHaveProperty('importId');
        });

        it('should allow custom cancellation messages', () => {
            const dto: ImportCancelledResponseDto = {
                message: 'Import operation cancelled by administrator',
                importId: '507f1f77bcf86cd799439011',
            };

            expect(dto.message).toBe('Import operation cancelled by administrator');
        });
    });
});
