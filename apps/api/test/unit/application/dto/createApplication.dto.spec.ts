import { validate } from 'class-validator';
import { CreateApplicationDto } from '../../../../src/application/dto/createApplication.dto';

describe('CreateApplicationDto', () => {
    describe('validation', () => {
        it('should validate successfully when cvExtension is a valid value and given dto is complete', async () => {
            const dto = new CreateApplicationDto();
            dto.cvExtension = 'pdf';
            dto.lmExtension = 'doc';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when only cvExtension is provided and valid', async () => {
            const dto = new CreateApplicationDto();
            dto.cvExtension = 'docx';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when cvExtension is missing', async () => {
            const dto = new CreateApplicationDto();

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('cvExtension');
        });

        it('should fail validation when cvExtension is not allowed', async () => {
            const dto = new CreateApplicationDto();
            dto.cvExtension = 'txt' as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const cvError = errors.find((error) => error.property === 'cvExtension');
            expect(cvError).toBeDefined();
            expect(cvError?.constraints).toHaveProperty('isEnum');
        });

        it('should fail validation when lmExtension is provided but invalid', async () => {
            const dto = new CreateApplicationDto();
            dto.cvExtension = 'pdf';
            dto.lmExtension = 'png' as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const lmError = errors.find((error) => error.property === 'lmExtension');
            expect(lmError).toBeDefined();
            expect(lmError?.constraints).toHaveProperty('isEnum');
        });
    });
});
