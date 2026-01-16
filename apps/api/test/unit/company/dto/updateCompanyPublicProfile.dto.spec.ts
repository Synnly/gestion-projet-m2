import { validate } from 'class-validator';
import { UpdateCompanyPublicProfileDto } from '../../../../src/company/dto/updateCompanyPublicProfile.dto';

describe('UpdateCompanyPublicProfileDto', () => {
    /**
     * Test suite for UpdateCompanyPublicProfileDto validation
     * Ensures that the DTO correctly validates all public profile fields
     * This DTO is used to update company public profile information visible to students
     */

    it('should create UpdateCompanyPublicProfileDto with all valid fields', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            description: 'Tech company',
            emailContact: 'contact@company.com',
            telephone: '+33123456789',
            website: 'https://company.com',
            streetNumber: '10',
            streetName: 'Rue de Test',
            postalCode: '75001',
            city: 'Paris',
            country: 'France',
        });

        expect(dto.description).toBe('Tech company');
        expect(dto.emailContact).toBe('contact@company.com');
        expect(dto.telephone).toBe('+33123456789');
        expect(dto.website).toBe('https://company.com');
        expect(dto.city).toBe('Paris');
    });

    it('should create UpdateCompanyPublicProfileDto with partial fields', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            description: 'Only description',
            emailContact: 'email@company.com',
        });

        expect(dto.description).toBe('Only description');
        expect(dto.emailContact).toBe('email@company.com');
        expect(dto.telephone).toBeUndefined();
        expect(dto.website).toBeUndefined();
    });

    it('should create UpdateCompanyPublicProfileDto with empty object', async () => {
        const dto = new UpdateCompanyPublicProfileDto({});

        expect(dto.description).toBeUndefined();
        expect(dto.emailContact).toBeUndefined();
        expect(dto.telephone).toBeUndefined();
    });

    it('should validate emailContact as valid email', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            emailContact: 'valid@company.com',
        });

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should reject invalid email in emailContact', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            emailContact: 'invalid-email',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('emailContact');
    });

    it('should validate website as valid URL', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            website: 'https://company.com',
        });

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should reject invalid URL in website', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            website: 'not-a-url',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('website');
    });

    it('should validate description as string', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            description: 'Valid description text',
        });

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should validate telephone as string', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            telephone: '+33123456789',
        });

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should validate address fields as strings', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            streetNumber: '42',
            streetName: 'Avenue des Tests',
            postalCode: '75001',
            city: 'Paris',
            country: 'France',
        });

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should allow all fields to be optional', async () => {
        const dto = new UpdateCompanyPublicProfileDto({});

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should validate URL format strictly for website field', async () => {
        const invalidUrls = ['ftp://invalid.com', 'htp://wrong.com', 'just-text'];
        
        for (const url of invalidUrls) {
            const dto = new UpdateCompanyPublicProfileDto({ website: url });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(0);
        }
    });

    it('should validate email format strictly for emailContact field', async () => {
        const invalidEmails = ['test@', '@test.com', 'test@@company.com'];
        
        for (const email of invalidEmails) {
            const dto = new UpdateCompanyPublicProfileDto({ emailContact: email });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        }
    });

    it('should accept valid HTTPS URLs', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            website: 'https://company.example.com',
        });

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });

    it('should accept valid HTTP URLs', async () => {
        const dto = new UpdateCompanyPublicProfileDto({
            website: 'http://company.example.com',
        });

        const errors = await validate(dto);
        expect(errors).toEqual([]);
    });
});
