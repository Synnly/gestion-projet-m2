import {
    ExportInitiatedResponseDto,
    ExportStatusResponseDto,
    ExportCancelledResponseDto,
} from '../../../../src/admin/dto/exportResponseDto';
import { ExportStatus } from '../../../../src/admin/database-export.schema';

describe('ExportResponseDto', () => {
    describe('ExportInitiatedResponseDto', () => {
        it('should create an instance with all required properties', () => {
            const dto = new ExportInitiatedResponseDto();
            dto.message = 'Export initiated successfully';
            dto.exportId = '507f1f77bcf86cd799439011';
            dto.status = ExportStatus.PENDING;

            expect(dto.message).toBe('Export initiated successfully');
            expect(dto.exportId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ExportStatus.PENDING);
        });

        it('should allow setting properties individually', () => {
            const dto = new ExportInitiatedResponseDto();
            
            dto.message = 'Export started';
            expect(dto.message).toBe('Export started');
            
            dto.exportId = '507f1f77bcf86cd799439012';
            expect(dto.exportId).toBe('507f1f77bcf86cd799439012');
            
            dto.status = ExportStatus.IN_PROGRESS;
            expect(dto.status).toBe(ExportStatus.IN_PROGRESS);
        });
    });

    describe('ExportStatusResponseDto', () => {
        it('should create an instance with required properties only', () => {
            const dto = new ExportStatusResponseDto();
            dto.exportId = '507f1f77bcf86cd799439011';
            dto.status = ExportStatus.PENDING;

            expect(dto.exportId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ExportStatus.PENDING);
            expect(dto.fileUrl).toBeUndefined();
            expect(dto.fileSize).toBeUndefined();
        });

        it('should create an instance with all properties including optional ones', () => {
            const dto = new ExportStatusResponseDto();
            const startedAt = new Date('2026-02-07T10:00:00Z');
            const completedAt = new Date('2026-02-07T10:05:00Z');

            dto.exportId = '507f1f77bcf86cd799439011';
            dto.status = ExportStatus.COMPLETED;
            dto.fileUrl = '/api/admin/export/507f1f77bcf86cd799439011/download';
            dto.fileSize = 1024000;
            dto.collectionsCount = 10;
            dto.documentsCount = 1000;
            dto.startedAt = startedAt;
            dto.completedAt = completedAt;

            expect(dto.exportId).toBe('507f1f77bcf86cd799439011');
            expect(dto.status).toBe(ExportStatus.COMPLETED);
            expect(dto.fileUrl).toBe('/api/admin/export/507f1f77bcf86cd799439011/download');
            expect(dto.fileSize).toBe(1024000);
            expect(dto.collectionsCount).toBe(10);
            expect(dto.documentsCount).toBe(1000);
            expect(dto.startedAt).toEqual(startedAt);
            expect(dto.completedAt).toEqual(completedAt);
        });

        it('should allow setting error message for failed exports', () => {
            const dto = new ExportStatusResponseDto();
            dto.exportId = '507f1f77bcf86cd799439011';
            dto.status = ExportStatus.FAILED;
            dto.errorMessage = 'Database connection lost';

            expect(dto.status).toBe(ExportStatus.FAILED);
            expect(dto.errorMessage).toBe('Database connection lost');
        });

        it('should handle cancelled status', () => {
            const dto = new ExportStatusResponseDto();
            dto.exportId = '507f1f77bcf86cd799439011';
            dto.status = ExportStatus.CANCELLED;

            expect(dto.status).toBe(ExportStatus.CANCELLED);
        });

        it('should handle in-progress status with partial data', () => {
            const dto = new ExportStatusResponseDto();
            const startedAt = new Date();

            dto.exportId = '507f1f77bcf86cd799439011';
            dto.status = ExportStatus.IN_PROGRESS;
            dto.startedAt = startedAt;

            expect(dto.status).toBe(ExportStatus.IN_PROGRESS);
            expect(dto.startedAt).toEqual(startedAt);
            expect(dto.completedAt).toBeUndefined();
            expect(dto.fileUrl).toBeUndefined();
        });
    });

    describe('ExportCancelledResponseDto', () => {
        it('should create an instance with all required properties', () => {
            const dto = new ExportCancelledResponseDto();
            dto.message = 'Export cancelled successfully';
            dto.exportId = '507f1f77bcf86cd799439011';

            expect(dto.message).toBe('Export cancelled successfully');
            expect(dto.exportId).toBe('507f1f77bcf86cd799439011');
        });

        it('should allow different message texts', () => {
            const messages = [
                'Export cancelled by user',
                'Export job terminated',
                'Cancellation completed',
            ];

            messages.forEach((message) => {
                const dto = new ExportCancelledResponseDto();
                dto.message = message;
                dto.exportId = '507f1f77bcf86cd799439011';

                expect(dto.message).toBe(message);
            });
        });

        it('should allow setting properties individually', () => {
            const dto = new ExportCancelledResponseDto();
            
            dto.message = 'Cancelled';
            expect(dto.message).toBe('Cancelled');
            
            dto.exportId = '507f1f77bcf86cd799439012';
            expect(dto.exportId).toBe('507f1f77bcf86cd799439012');
        });
    });

    describe('All DTOs - Common behaviors', () => {
        it('should allow property reassignment', () => {
            const dto = new ExportInitiatedResponseDto();
            
            dto.exportId = '507f1f77bcf86cd799439011';
            expect(dto.exportId).toBe('507f1f77bcf86cd799439011');
            
            dto.exportId = '507f1f77bcf86cd799439012';
            expect(dto.exportId).toBe('507f1f77bcf86cd799439012');
        });

        it('should handle all ExportStatus enum values', () => {
            const statusDto = new ExportStatusResponseDto();
            
            Object.values(ExportStatus).forEach((status) => {
                statusDto.status = status;
                expect(statusDto.status).toBe(status);
            });
        });
    });
});
