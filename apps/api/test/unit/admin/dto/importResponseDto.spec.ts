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
            const dto = new ImportInitiatedResponseDto();
            dto.message = 'Import initiated. You will receive an email when the import is complete.';
            dto.importId = '507f1f77bcf86cd799439011';
            dto.status = ImportStatus.PENDING;

            expect(dto).toBeDefined();
            expect(dto.message).toBe('Import initiated. You will receive an email when the import is complete.');
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ImportStatus.PENDING);
        });

        it('should have required properties', () => {
            const dto = new ImportInitiatedResponseDto();
            dto.message = 'Import started';
            dto.importId = '123456';
            dto.status = ImportStatus.PENDING;

            expect(dto).toHaveProperty('message');
            expect(dto).toHaveProperty('importId');
            expect(dto).toHaveProperty('status');
        });
    });

    describe('ImportStatusResponseDto', () => {
        it('should create a valid ImportStatusResponseDto with all properties', () => {
            const dto = new ImportStatusResponseDto();
            dto.importId = '507f1f77bcf86cd799439011';
            dto.status = ImportStatus.COMPLETED;
            dto.filename = 'database-backup.json.gz';
            dto.fileSize = 1048576;
            dto.collectionsCount = 15;
            dto.documentsCount = 2500;
            dto.startedAt = new Date('2026-02-08T10:00:00Z');
            dto.completedAt = new Date('2026-02-08T10:05:00Z');

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
            const dto = new ImportStatusResponseDto();
            dto.importId = '507f1f77bcf86cd799439011';
            dto.status = ImportStatus.PENDING;

            expect(dto).toBeDefined();
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ImportStatus.PENDING);
            expect(dto.filename).toBeUndefined();
            expect(dto.fileSize).toBeUndefined();
        });

        it('should include error message when import fails', () => {
            const dto = new ImportStatusResponseDto();
            dto.importId = '507f1f77bcf86cd799439011';
            dto.status = ImportStatus.FAILED;
            dto.errorMessage = 'Invalid JSON format in import file';
            dto.startedAt = new Date('2026-02-08T10:00:00Z');
            dto.completedAt = new Date('2026-02-08T10:01:00Z');

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
                const dto = new ImportStatusResponseDto();
                dto.importId = '507f1f77bcf86cd799439011';
                dto.status = status;

                expect(dto.status).toBe(status);
            });
        });
    });

    describe('ImportListItemDto', () => {
        it('should create a valid ImportListItemDto with all properties', () => {
            const createdAt = new Date('2026-02-08T09:00:00Z');
            const dto = new ImportListItemDto();
            dto.importId = '507f1f77bcf86cd799439011';
            dto.status = ImportStatus.COMPLETED;
            dto.filename = 'database-backup.json.gz';
            dto.fileSize = 2097152;
            dto.collectionsCount = 20;
            dto.documentsCount = 5000;
            dto.startedAt = new Date('2026-02-08T10:00:00Z');
            dto.completedAt = new Date('2026-02-08T10:10:00Z');
            dto.createdAt = createdAt;

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
            const dto = new ImportListItemDto();
            dto.importId = '507f1f77bcf86cd799439011';
            dto.status = ImportStatus.PENDING;
            dto.createdAt = createdAt;

            expect(dto).toBeDefined();
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ImportStatus.PENDING);
            expect(dto.createdAt).toBe(createdAt);
            expect(dto.filename).toBeUndefined();
        });

        it('should have required createdAt property', () => {
            const dto = new ImportListItemDto();
            dto.importId = '507f1f77bcf86cd799439011';
            dto.status = ImportStatus.IN_PROGRESS;
            dto.createdAt = new Date();

            expect(dto).toHaveProperty('createdAt');
            expect(dto.createdAt).toBeInstanceOf(Date);
        });

        it('should support listing imports in different states', () => {
            const createdAt = new Date();
            const dto1 = new ImportListItemDto();
            dto1.importId = '1';
            dto1.status = ImportStatus.COMPLETED;
            dto1.collectionsCount = 10;
            dto1.documentsCount = 1000;
            dto1.createdAt = createdAt;

            const dto2 = new ImportListItemDto();
            dto2.importId = '2';
            dto2.status = ImportStatus.IN_PROGRESS;
            dto2.startedAt = new Date();
            dto2.createdAt = createdAt;

            const dto3 = new ImportListItemDto();
            dto3.importId = '3';
            dto3.status = ImportStatus.FAILED;
            dto3.completedAt = new Date();
            dto3.createdAt = createdAt;

            const imports = [dto1, dto2, dto3];

            expect(imports).toHaveLength(3);
            expect(imports[0].status).toBe(ImportStatus.COMPLETED);
            expect(imports[1].status).toBe(ImportStatus.IN_PROGRESS);
            expect(imports[2].status).toBe(ImportStatus.FAILED);
        });
    });

    describe('ImportCancelledResponseDto', () => {
        it('should create a valid ImportCancelledResponseDto', () => {
            const dto = new ImportCancelledResponseDto();
            dto.message = 'Import cancelled successfully';
            dto.importId = '507f1f77bcf86cd799439011';

            expect(dto).toBeDefined();
            expect(dto.message).toBe('Import cancelled successfully');
            expect(dto.importId).toBe('507f1f77bcf86cd799439011');
        });

        it('should have required properties', () => {
            const dto = new ImportCancelledResponseDto();
            dto.message = 'Cancelled';
            dto.importId = '123';

            expect(dto).toHaveProperty('message');
            expect(dto).toHaveProperty('importId');
        });

        it('should allow custom cancellation messages', () => {
            const dto = new ImportCancelledResponseDto();
            dto.message = 'Import operation cancelled by administrator';
            dto.importId = '507f1f77bcf86cd799439011';

            expect(dto.message).toBe('Import operation cancelled by administrator');
        });
    });
});
