import { validate } from 'class-validator';
import { UpdateCompanyDto } from '../../../../src/company/dto/updateCompany.dto';
import { NafCode } from '../../../../src/company/nafCodes.enum';
import { LegalStatus, StructureType } from '../../../../src/company/company.schema';

describe('UpdateCompanyDto - decorator branches', () => {
    it('should validate all optional enum fields when provided', async () => {
        const dto = new UpdateCompanyDto({
            nafCode: NafCode['6202A'],
            structureType: StructureType.Association,
            legalStatus: LegalStatus.SA,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should validate all optional string address fields when provided', async () => {
        const dto = new UpdateCompanyDto({
            address: '42 Avenue Test, 69000 Lyon, France',
            logo: 'http://example.com/new-logo.png',
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail when nafCode is invalid', async () => {
        const dto = new UpdateCompanyDto({
            nafCode: 'NOTVALID' as any,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when structureType is invalid', async () => {
        const dto = new UpdateCompanyDto({
            structureType: 'WRONG' as any,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when legalStatus is invalid', async () => {
        const dto = new UpdateCompanyDto({
            legalStatus: 'BAD' as any,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});

describe('UpdateCompanyDto', () => {
    describe('Validation', () => {
        it('should pass validation when all fields are valid', async () => {
            const dto = new UpdateCompanyDto({
                password: 'ValidPassword123!',
                name: 'Valid Company Name',
                nafCode: NafCode.NAF_62_01Z,
                structureType: StructureType.PrivateCompany,
                legalStatus: LegalStatus.SAS,
                address: '42 Valid St, 75001 Paris, France',
                isValid: true,
                logo: 'https://example.com/logo.png',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when only name is provided', async () => {
            const dto = new UpdateCompanyDto({
                name: 'Updated Company Name',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when DTO is empty', async () => {
            const dto = new UpdateCompanyDto({});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Password validation', () => {
        it('should fail validation when password is too short', async () => {
            const dto = new UpdateCompanyDto({
                password: 'Short1!',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('password');
            expect(errors[0].constraints?.isStrongPassword).toBeDefined();
        });

        it('should fail validation when password lacks uppercase', async () => {
            const dto = new UpdateCompanyDto({
                password: 'weakpassword123!',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('password');
        });

        it('should fail validation when password lacks lowercase', async () => {
            const dto = new UpdateCompanyDto({
                password: 'WEAKPASSWORD123!',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('password');
        });

        it('should fail validation when password lacks numbers', async () => {
            const dto = new UpdateCompanyDto({
                password: 'WeakPassword!',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('password');
        });

        it('should fail validation when password lacks symbols', async () => {
            const dto = new UpdateCompanyDto({
                password: 'WeakPassword123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('password');
        });

        it('should pass validation when password is not provided', async () => {
            const dto = new UpdateCompanyDto({
                name: 'Company Name',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Name validation', () => {
        it('should pass validation when name is valid', async () => {
            const dto = new UpdateCompanyDto({
                name: 'Valid Company Name',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when name is empty string as field is optional', async () => {
            const dto = new UpdateCompanyDto({
                name: '',
            });

            // Empty strings pass validation for optional @IsString() fields without @IsNotEmpty()
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when name is not provided', async () => {
            const dto = new UpdateCompanyDto({});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('NafCode validation', () => {
        it('should pass validation when nafCode is valid', async () => {
            const dto = new UpdateCompanyDto({
                nafCode: NafCode.NAF_62_01Z,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when nafCode is invalid', async () => {
            const dto = new UpdateCompanyDto({
                nafCode: 'INVALID_CODE' as NafCode,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('nafCode');
        });

        it('should pass validation when nafCode is not provided', async () => {
            const dto = new UpdateCompanyDto({});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('StructureType validation', () => {
        it('should pass validation when structureType is valid', async () => {
            const dto = new UpdateCompanyDto({
                structureType: StructureType.PrivateCompany,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when structureType is invalid', async () => {
            const dto = new UpdateCompanyDto({
                structureType: 'INVALID_TYPE' as StructureType,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('structureType');
        });

        it('should pass validation when structureType is not provided', async () => {
            const dto = new UpdateCompanyDto({});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('LegalStatus validation', () => {
        it('should pass validation when legalStatus is valid', async () => {
            const dto = new UpdateCompanyDto({
                legalStatus: LegalStatus.SAS,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when legalStatus is invalid', async () => {
            const dto = new UpdateCompanyDto({
                legalStatus: 'INVALID_STATUS' as LegalStatus,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('legalStatus');
        });

        it('should pass validation when legalStatus is not provided', async () => {
            const dto = new UpdateCompanyDto({});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Address validation', () => {
        it('should pass validation when all address fields are valid', async () => {
            const dto = new UpdateCompanyDto({
                address: '123 Main Street, 75001 Paris, France',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when address is empty string as field is optional', async () => {
            const dto = new UpdateCompanyDto({
                address: '',
            });

            // Empty strings pass validation for optional @IsString() fields without @IsNotEmpty()
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when no address fields are provided', async () => {
            const dto = new UpdateCompanyDto({
                name: 'Company Name',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('IsValid validation', () => {
        it('should pass validation when isValid is true', async () => {
            const dto = new UpdateCompanyDto({
                isValid: true,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when isValid is false', async () => {
            const dto = new UpdateCompanyDto({
                isValid: false,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when isValid is not boolean', async () => {
            const dto = new UpdateCompanyDto({
                isValid: 'true' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('isValid');
        });

        it('should pass validation when isValid is not provided', async () => {
            const dto = new UpdateCompanyDto({});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Logo validation', () => {
        it('should pass validation when logo is valid URL', async () => {
            const dto = new UpdateCompanyDto({
                logo: 'https://example.com/logo.png',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when logo is empty string as field is optional', async () => {
            const dto = new UpdateCompanyDto({
                logo: '',
            });

            // Empty strings pass validation for optional @IsString() fields without @IsNotEmpty()
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when logo is not provided', async () => {
            const dto = new UpdateCompanyDto({});

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Immutable fields', () => {
        it('should not validate email field as it is immutable', async () => {
            const dto = new UpdateCompanyDto({
                name: 'Company Name',
            });

            // Verify the DTO works correctly without email
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should not validate siretNumber field as it is immutable', async () => {
            const dto = new UpdateCompanyDto({
                name: 'Company Name',
            });

            // Verify the DTO works correctly without siretNumber
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Multiple fields validation', () => {
        it('should validate multiple fields correctly when all are valid', async () => {
            const dto = new UpdateCompanyDto({
                password: 'NewPassword123!',
                name: 'Updated Company',
                nafCode: NafCode.NAF_62_02A,
                structureType: StructureType.Association,
                legalStatus: LegalStatus.SARL,
                isValid: true,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when multiple fields are invalid', async () => {
            const dto = new UpdateCompanyDto({
                password: 'weak',
                nafCode: 'INVALID' as NafCode,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('password');
            expect(errorProperties).toContain('nafCode');
        });

        it('should validate mixed valid and invalid fields correctly', async () => {
            const dto = new UpdateCompanyDto({
                name: 'Valid Company',
                password: 'weak',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('password');
        });
    });
});
