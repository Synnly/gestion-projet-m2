import { validate } from 'class-validator';
import { CancelExportDto } from '../../../../src/admin/dto/cancelExportDto';

describe('CancelExportDto', () => {
    it('should validate a valid dto with a valid MongoDB ObjectId', async () => {
        const dto = new CancelExportDto();
        dto.exportId = '507f1f77bcf86cd799439011';
        
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail validation when exportId is not a valid MongoDB ObjectId', async () => {
        const dto = new CancelExportDto();
        dto.exportId = 'invalid-id';
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('exportId');
    });

    it('should fail validation when exportId is a number', async () => {
        const dto = new CancelExportDto();
        dto.exportId = '12345' as any;
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('exportId');
    });

    it('should fail validation when exportId is empty', async () => {
        const dto = new CancelExportDto();
        dto.exportId = '';
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('exportId');
    });

    it('should fail validation when exportId is undefined', async () => {
        const dto = new CancelExportDto();
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('exportId');
    });

    it('should fail validation when exportId has incorrect length', async () => {
        const dto = new CancelExportDto();
        dto.exportId = '507f1f77bcf86cd7';
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('exportId');
    });

    it('should fail validation when exportId contains invalid characters', async () => {
        const dto = new CancelExportDto();
        dto.exportId = '507f1f77bcf86cd79943901g'; // 'g' is not a valid hex character
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('exportId');
    });
});
