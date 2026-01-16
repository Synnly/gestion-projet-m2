import { validate } from 'class-validator';
import { CompanyPublicDto } from '../../../../src/company/dto/publicProfileCompany.dto';

describe('CompanyPublicDto', () => {
    /**
     * Test suite for CompanyPublicDto validation
     * Ensures that the DTO correctly represents the public company profile for students
     * This DTO is used to display read-only company information to students
     */

    it('should create CompanyPublicDto with required name field', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';

        expect(dto.name).toBe('Test Company');
    });

    it('should create CompanyPublicDto with all public fields', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.description = 'A great company';
        dto.emailContact = 'contact@test.com';
        dto.telephone = '+33123456789';
        dto.website = 'https://test.com';
        dto.streetNumber = '10';
        dto.streetName = 'Rue de Test';
        dto.postalCode = '75001';
        dto.city = 'Paris';
        dto.country = 'France';

        expect(dto.name).toBe('Test Company');
        expect(dto.description).toBe('A great company');
        expect(dto.emailContact).toBe('contact@test.com');
        expect(dto.website).toBe('https://test.com');
        expect(dto.city).toBe('Paris');
    });

    it('should create CompanyPublicDto with minimal fields', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';

        expect(dto.name).toBe('Test Company');
        expect(dto.description).toBeUndefined();
        expect(dto.emailContact).toBeUndefined();
    });

    it('should validate name as required string', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Valid Name';

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should validate emailContact as valid email when provided', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.emailContact = 'valid@test.com';

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should reject invalid email in emailContact', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.emailContact = 'invalid-email';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('emailContact');
    });

    it('should validate website as valid URL when provided', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.website = 'https://company.com';

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should reject invalid URL in website', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.website = 'not-a-url';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('website');
    });

    it('should allow optional fields to be undefined', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';

        expect(dto.description).toBeUndefined();
        expect(dto.emailContact).toBeUndefined();
        expect(dto.telephone).toBeUndefined();
        expect(dto.website).toBeUndefined();
    });

    it('should validate complete address fields', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.streetNumber = '42';
        dto.streetName = 'Avenue Test';
        dto.postalCode = '75001';
        dto.city = 'Paris';
        dto.country = 'France';

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should validate telephone as string', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.telephone = '+33123456789';

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should validate description as string', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.description = 'A comprehensive description of the company';

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should accept various valid email formats', async () => {
        const validEmails = [
            'contact@company.fr',
            'info@my-company.com',
            'hello+student@company.org',
        ];

        for (const email of validEmails) {
            const dto = new CompanyPublicDto();
            dto.name = 'Test Company';
            dto.emailContact = email;

            const errors = await validate(dto);
            expect(errors).toEqual([]);
        }
    });

    it('should accept various valid URL formats', async () => {
        const validUrls = [
            'https://company.com',
            'http://company.fr',
            'https://www.company.example.org',
        ];

        for (const url of validUrls) {
            const dto = new CompanyPublicDto();
            dto.name = 'Test Company';
            dto.website = url;

            const errors = await validate(dto);
            expect(errors).toEqual([]);
        }
    });

    it('should create CompanyPublicDto with partial address', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company';
        dto.city = 'Paris';
        dto.country = 'France';

        expect(dto.city).toBe('Paris');
        expect(dto.country).toBe('France');
        expect(dto.streetNumber).toBeUndefined();
    });

    it('should validate name field is string', async () => {
        const dto = new CompanyPublicDto();
        dto.name = 'Test Company with 123 and symbols!@#';

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });
});
