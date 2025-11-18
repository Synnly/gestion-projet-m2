import { validate } from 'class-validator';
import { SendCustomTemplateDto } from '../../../../src/mailer/dto/sendCustomTemplate.dto';

describe('SendCustomTemplateDto', () => {
    it('should pass validation with valid template name', async () => {
        const dto = new SendCustomTemplateDto();
        dto.templateName = 'finishVerif';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass validation with template name at max length (50)', async () => {
        const dto = new SendCustomTemplateDto();
        dto.templateName = 'a'.repeat(50);

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation with empty template name', async () => {
        const dto = new SendCustomTemplateDto();
        dto.templateName = '';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('templateName');
    });

    it('should fail validation with missing template name', async () => {
        const dto = new SendCustomTemplateDto();

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('templateName');
    });

    it('should fail validation with template name exceeding max length', async () => {
        const dto = new SendCustomTemplateDto();
        dto.templateName = 'a'.repeat(51);

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const templateError = errors.find((e) => e.property === 'templateName');
        expect(templateError).toBeDefined();
        expect(templateError?.constraints).toHaveProperty('maxLength');
    });

    it('should fail validation with non-string template name', async () => {
        const dto = new SendCustomTemplateDto();
        dto.templateName = 123 as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('templateName');
    });

    it('should accept common template names', async () => {
        const templateNames = [
            'signup-confirmation',
            'reset-password',
            'info-message',
            'finish-verif',
            'welcome-email',
        ];

        for (const name of templateNames) {
            const dto = new SendCustomTemplateDto();
            dto.templateName = name;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        }
    });
});
