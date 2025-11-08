import { validate } from 'class-validator';
import { UpdateCompanyDto } from '../../../../src/company/dto/updateCompany.dto';
import { StructureType, LegalStatus } from '../../../../src/company/company.schema';

describe('UpdateCompanyDto', () => {
    describe('constructor', () => {


        it('should create instance successfully when constructor is called with all fields', () => {
            const data = {
                email: 'updated@example.com',
                password: 'NewPassword123!',
                name: 'Updated Company',
                siretNumber: '12345678901234',
                nafCode: '6202A',
                structureType: StructureType.PrivateCompany,
                legalStatus: LegalStatus.SARL,
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
                isValid: true,
            };

            const dto = new UpdateCompanyDto(data);

            expect(dto.email).toBe('updated@example.com');
            expect(dto.password).toBe('NewPassword123!');
            expect(dto.name).toBe('Updated Company');
            expect(dto.siretNumber).toBe('12345678901234');
            expect(dto.nafCode).toBe('6202A');
            expect(dto.structureType).toBe(StructureType.PrivateCompany);
            expect(dto.legalStatus).toBe(LegalStatus.SARL);
            expect(dto.streetNumber).toBe('10');
            expect(dto.streetName).toBe('Rue de Test');
            expect(dto.postalCode).toBe('75001');
            expect(dto.city).toBe('Paris');
            expect(dto.country).toBe('France');
            expect(dto.isValid).toBe(true);
        });

    it('should create instance successfully when constructor is called with a single field', () => {
            const data = {
                name: 'Updated Name',
            };

            const dto = new UpdateCompanyDto(data);

            expect(dto.name).toBe('Updated Name');
            expect(dto.email).toBeUndefined();
            expect(dto.password).toBeUndefined();
            expect(dto.siretNumber).toBeUndefined();
        });

    it('should create instance successfully when constructor is called with an empty object', () => {
            const dto = new UpdateCompanyDto({});

            expect(dto.email).toBeUndefined();
            expect(dto.password).toBeUndefined();
            expect(dto.name).toBeUndefined();
            expect(dto.isValid).toBeUndefined();
        });

    it('should create instance successfully when constructor is called without data', () => {
            const dto = new UpdateCompanyDto(undefined as any);

            expect(dto).toBeDefined();
            expect(dto.email).toBeUndefined();
            expect(dto.name).toBeUndefined();
        });
    });

        describe('validation', () => {
        describe('email field', () => {


            it('should pass validation when email is not provided', async () => {
                const dto = new UpdateCompanyDto({
                    name: 'Updated Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when email is correct', async () => {
                const dto = new UpdateCompanyDto({
                    email: 'updated@example.com',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when email format is invalid', async () => {
                const dto = new UpdateCompanyDto({
                    email: 'invalid-email',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0].property).toBe('email');
                expect(errors[0].constraints).toHaveProperty('isEmail');
            });

            it('should pass validation when using various valid email formats', async () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@example.com',
                    'user+tag@example.co.uk',
                    'test123@test-domain.com',
                ];

                for (const email of validEmails) {
                    const dto = new UpdateCompanyDto({ email });
                    const errors = await validate(dto);
                    expect(errors.length).toBe(0);
                }
            });
        });

        describe('password field', () => {


            it('should pass validation when password is not provided', async () => {
                const dto = new UpdateCompanyDto({
                    name: 'Updated Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when password is strong', async () => {
                const dto = new UpdateCompanyDto({
                    password: 'NewPassword123!',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when password has no uppercase letters', async () => {
                const dto = new UpdateCompanyDto({
                    password: 'password123!',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
                expect(passwordError?.constraints).toHaveProperty('isStrongPassword');
            });

            it('should fail validation when password has no lowercase letters', async () => {
                const dto = new UpdateCompanyDto({
                    password: 'PASSWORD123!',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password has no number', async () => {
                const dto = new UpdateCompanyDto({
                    password: 'Password!',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password has no symbol', async () => {
                const dto = new UpdateCompanyDto({
                    password: 'Password123',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password is too short', async () => {
                const dto = new UpdateCompanyDto({
                    password: 'Pass1!',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password is empty', async () => {
                const dto = new UpdateCompanyDto({
                    password: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
                expect(passwordError?.constraints).toHaveProperty('isStrongPassword');
            });

            it('should pass validation when using various strong passwords', async () => {
                const strongPasswords = [
                    'Password123!',
                    'MyP@ssw0rd',
                    'Str0ng#Pass',
                    'C0mpl3x!Pass',
                    'S3cur3#Password',
                ];

                for (const password of strongPasswords) {
                    const dto = new UpdateCompanyDto({ password });
                    const errors = await validate(dto);
                    expect(errors.length).toBe(0);
                }
            });
        });

        describe('name field', () => {


            it('should pass validation when name is not provided', async () => {
                const dto = new UpdateCompanyDto({
                    email: 'test@example.com',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when name is valid', async () => {
                const dto = new UpdateCompanyDto({
                    name: 'Updated Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when name is empty', async () => {
                const dto = new UpdateCompanyDto({
                    name: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when name is not a string', async () => {
                const dto = new UpdateCompanyDto({
                    name: 123 as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const nameError = errors.find((e) => e.property === 'name');
                expect(nameError).toBeDefined();
            });

            it('should pass validation when name is long but valid', async () => {
                const dto = new UpdateCompanyDto({
                    name: 'A'.repeat(100),
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });

        describe('optional string fields', () => {


            it('should pass validation when all optional fields are undefined', async () => {
                const dto = new UpdateCompanyDto({});

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when siretNumber is valid', async () => {
                const dto = new UpdateCompanyDto({
                    siretNumber: '12345678901234',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when siretNumber is empty', async () => {
                const dto = new UpdateCompanyDto({
                    siretNumber: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when siretNumber is not a string', async () => {
                const dto = new UpdateCompanyDto({
                    siretNumber: 123 as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const siretError = errors.find((e) => e.property === 'siretNumber');
                expect(siretError).toBeDefined();
            });

            it('should pass validation when nafCode is valid', async () => {
                const dto = new UpdateCompanyDto({
                    nafCode: '6202A',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when nafCode is empty', async () => {
                const dto = new UpdateCompanyDto({
                    nafCode: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when all address fields are provided', async () => {
                const dto = new UpdateCompanyDto({
                    streetNumber: '10',
                    streetName: 'Rue de Test',
                    postalCode: '75001',
                    city: 'Paris',
                    country: 'France',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when streetNumber is empty', async () => {
                const dto = new UpdateCompanyDto({
                    streetNumber: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when streetName is empty', async () => {
                const dto = new UpdateCompanyDto({
                    streetName: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when postalCode is empty', async () => {
                const dto = new UpdateCompanyDto({
                    postalCode: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when city is empty', async () => {
                const dto = new UpdateCompanyDto({
                    city: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when country is empty', async () => {
                const dto = new UpdateCompanyDto({
                    country: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });

        describe('structureType field', () => {


            it('should pass validation when structureType is not provided', async () => {
                const dto = new UpdateCompanyDto({
                    name: 'Updated Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when structureType is valid', async () => {
                for (const structureType of Object.values(StructureType)) {
                    const dto = new UpdateCompanyDto({ structureType });
                    const errors = await validate(dto);
                    expect(errors.length).toBe(0);
                }
            });

            it('should fail validation when structureType is invalid', async () => {
                const dto = new UpdateCompanyDto({
                    structureType: 'InvalidType' as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const structureTypeError = errors.find((e) => e.property === 'structureType');
                expect(structureTypeError).toBeDefined();
                expect(structureTypeError?.constraints).toHaveProperty('isEnum');
            });

            it('should fail validation when structureType is empty', async () => {
                const dto = new UpdateCompanyDto({
                    structureType: '' as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const structureTypeError = errors.find((e) => e.property === 'structureType');
                expect(structureTypeError).toBeDefined();
            });
        });

        describe('legalStatus field', () => {


            it('should pass validation when legalStatus is not provided', async () => {
                const dto = new UpdateCompanyDto({
                    name: 'Updated Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when legalStatus is valid', async () => {
                for (const legalStatus of Object.values(LegalStatus)) {
                    const dto = new UpdateCompanyDto({ legalStatus });
                    const errors = await validate(dto);
                    expect(errors.length).toBe(0);
                }
            });

            it('should fail validation when legalStatus is invalid', async () => {
                const dto = new UpdateCompanyDto({
                    legalStatus: 'InvalidStatus' as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const legalStatusError = errors.find((e) => e.property === 'legalStatus');
                expect(legalStatusError).toBeDefined();
                expect(legalStatusError?.constraints).toHaveProperty('isEnum');
            });

            it('should fail validation when legalStatus is empty', async () => {
                const dto = new UpdateCompanyDto({
                    legalStatus: '' as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const legalStatusError = errors.find((e) => e.property === 'legalStatus');
                expect(legalStatusError).toBeDefined();
            });
        });

        describe('isValid field', () => {


            it('should pass validation when isValid is not provided', async () => {
                const dto = new UpdateCompanyDto({
                    name: 'Updated Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

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
                const isValidError = errors.find((e) => e.property === 'isValid');
                expect(isValidError).toBeDefined();
                expect(isValidError?.constraints).toHaveProperty('isBoolean');
            });

            it('should fail validation when isValid is a number', async () => {
                const dto = new UpdateCompanyDto({
                    isValid: 1 as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const isValidError = errors.find((e) => e.property === 'isValid');
                expect(isValidError).toBeDefined();
            });
        });

        describe('multiple field updates', () => {


            it('should pass validation when partial update contains multiple valid fields', async () => {
                const dto = new UpdateCompanyDto({
                    name: 'Updated Company',
                    email: 'updated@example.com',
                    isValid: true,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when update contains all fields', async () => {
                const dto = new UpdateCompanyDto({
                    email: 'complete@example.com',
                    password: 'NewPassword123!',
                    name: 'Complete Update',
                    siretNumber: '12345678901234',
                    nafCode: '6202A',
                    structureType: StructureType.PrivateCompany,
                    legalStatus: LegalStatus.SARL,
                    streetNumber: '10',
                    streetName: 'Rue Complete',
                    postalCode: '75001',
                    city: 'Paris',
                    country: 'France',
                    isValid: true,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should return multiple validation errors when multiple update fields are invalid', async () => {
                const dto = new UpdateCompanyDto({
                    email: 'invalid-email',
                    password: 'weak',
                    name: '',
                    siretNumber: '',
                    isValid: 'not-boolean' as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);

                const properties = errors.map((e) => e.property);
                expect(properties).toContain('email');
                expect(properties).toContain('password');
                expect(properties).toContain('isValid');
            });
        });

        describe('edge cases', () => {


            it('should pass validation when DTO is empty', async () => {
                const dto = new UpdateCompanyDto({});

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when email contains leading or trailing whitespace', async () => {
                const dto = new UpdateCompanyDto({
                    email: '  updated@example.com  ',
                    name: '  Updated Company  ',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const emailError = errors.find((e) => e.property === 'email');
                expect(emailError).toBeDefined();
            });

            it('should pass validation when updating only email', async () => {
                const dto = new UpdateCompanyDto({
                    email: 'newemail@example.com',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when updating only password', async () => {
                const dto = new UpdateCompanyDto({
                    password: 'NewPassword123!',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when updating only isValid', async () => {
                const dto = new UpdateCompanyDto({
                    isValid: true,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when updating only structureType', async () => {
                const dto = new UpdateCompanyDto({
                    structureType: StructureType.Association,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when updating only legalStatus', async () => {
                const dto = new UpdateCompanyDto({
                    legalStatus: LegalStatus.SAS,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when updating only address fields', async () => {
                const dto = new UpdateCompanyDto({
                    streetNumber: '25',
                    streetName: 'New Street',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should accept null values for optional fields without throwing validation errors', async () => {
                const dto = new UpdateCompanyDto({
                    email: null as any,
                    password: null as any,
                    name: null as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });
    });

    describe('property modifications', () => {
        it('should allow property modification after creation', () => {
            const dto = new UpdateCompanyDto({
                name: 'Original Name',
            });

            dto.name = 'Modified Name';
            dto.email = 'modified@example.com';

            expect(dto.name).toBe('Modified Name');
            expect(dto.email).toBe('modified@example.com');
        });

        it('should allow adding properties after creation', () => {
            const dto = new UpdateCompanyDto({});

            dto.name = 'Added Name';
            dto.isValid = true;

            expect(dto.name).toBe('Added Name');
            expect(dto.isValid).toBe(true);
        });
    });
});
