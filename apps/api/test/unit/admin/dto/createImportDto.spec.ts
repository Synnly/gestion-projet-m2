import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateImportDto } from '../../../../src/admin/dto/createImportDto';

describe('CreateImportDto', () => {
    it('should create a valid dto with default clearExisting as false', () => {
        const dto = new CreateImportDto();

        expect(dto.clearExisting).toBe(false);
    });

    it('should validate a valid dto with clearExisting as true', async () => {
        const dto = new CreateImportDto();
        dto.clearExisting = true;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.clearExisting).toBe(true);
    });

    it('should validate a valid dto with clearExisting as false', async () => {
        const dto = new CreateImportDto();
        dto.clearExisting = false;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.clearExisting).toBe(false);
    });

    it('should validate a valid dto with clearExisting undefined (optional)', async () => {
        const dto = new CreateImportDto();
        dto.clearExisting = undefined;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should transform string "true" to boolean true', async () => {
        const plain = { clearExisting: 'true' };
        const dto = plainToInstance(CreateImportDto, plain);

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.clearExisting).toBe(true);
        expect(typeof dto.clearExisting).toBe('boolean');
    });

    it('should transform string "false" to boolean false', async () => {
        const plain = { clearExisting: 'false' };
        const dto = plainToInstance(CreateImportDto, plain);

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.clearExisting).toBe(false);
        expect(typeof dto.clearExisting).toBe('boolean');
    });

    it('should fail validation when clearExisting is an invalid string', async () => {
        const plain = { clearExisting: 'invalid' };
        const dto = plainToInstance(CreateImportDto, plain);

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('clearExisting');
    });

    it('should fail validation when clearExisting is a number', async () => {
        const dto = new CreateImportDto();
        (dto.clearExisting as any) = 1;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('clearExisting');
    });

    it('should fail validation when clearExisting is an object', async () => {
        const dto = new CreateImportDto();
        (dto.clearExisting as any) = { value: true };

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('clearExisting');
    });

    it('should have optional clearExisting property', () => {
        const dto = new CreateImportDto();
        delete dto.clearExisting;

        expect(dto.clearExisting).toBeUndefined();
    });

    it('should set clearExisting property after instantiation', () => {
        const dto = new CreateImportDto();
        expect(dto.clearExisting).toBe(false);

        dto.clearExisting = true;
        expect(dto.clearExisting).toBe(true);

        dto.clearExisting = false;
        expect(dto.clearExisting).toBe(false);
    });
});
