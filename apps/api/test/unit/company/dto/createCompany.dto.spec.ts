import { validate } from 'class-validator';
import { CreateCompanyDto } from '../../../../src/company/dto/createCompany.dto';
import { StructureType, LegalStatus } from '../../../../src/company/company.schema';
import { NafCode } from '../../../../src/company/nafCodes.enum';

describe('CreateCompanyDto - decorator branches', () => {
    it('should validate all optional enum fields when provided', async () => {
        const dto = new CreateCompanyDto({
            email: 'test@test.com',
            password: 'Password123!',
            role: 'COMPANY' as any,
            name: 'Company',
            nafCode: NafCode['6202A'],
            structureType: StructureType.PrivateCompany,
            legalStatus: LegalStatus.SARL,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should validate all optional string fields when provided', async () => {
        const dto = new CreateCompanyDto({
            email: 'test@test.com',
            password: 'Password123!',
            role: 'COMPANY' as any,
            name: 'Company',
            address: '123 Main St',
            logo: 'http://example.com/logo.png',
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail when siretNumber has invalid format', async () => {
        const dto = new CreateCompanyDto({
            email: 'test@test.com',
            password: 'Password123!',
            role: 'COMPANY' as any,
            name: 'Company',
            siretNumber: 'abc123',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when nafCode is invalid enum value', async () => {
        const dto = new CreateCompanyDto({
            email: 'test@test.com',
            password: 'Password123!',
            role: 'COMPANY' as any,
            name: 'Company',
            nafCode: 'INVALID' as any,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when structureType is invalid enum value', async () => {
        const dto = new CreateCompanyDto({
            email: 'test@test.com',
            password: 'Password123!',
            role: 'COMPANY' as any,
            name: 'Company',
            structureType: 'INVALID' as any,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail when legalStatus is invalid enum value', async () => {
        const dto = new CreateCompanyDto({
            email: 'test@test.com',
            password: 'Password123!',
            role: 'COMPANY' as any,
            name: 'Company',
            legalStatus: 'INVALID' as any,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});

describe('CreateCompanyDto', () => {
    describe('constructor', () => {
        it('should create instance successfully when constructor is called with all fields', () => {
            const data = {
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
                siretNumber: '12345678901234',
                nafCode: NafCode.NAF_62_02A,
                structureType: StructureType.PrivateCompany,
                legalStatus: LegalStatus.SARL,
                address: '10 Rue de Test, 75001 Paris, France',
            };

            const dto = new CreateCompanyDto(data);

            expect(dto.email).toBe('test@example.com');
            expect(dto.password).toBe('Password123!');
            expect(dto.name).toBe('Test Company');
            expect(dto.siretNumber).toBe('12345678901234');
            expect(dto.nafCode).toBe(NafCode.NAF_62_02A);
            expect(dto.structureType).toBe(StructureType.PrivateCompany);
            expect(dto.legalStatus).toBe(LegalStatus.SARL);
            expect(dto.address).toBe('10 Rue de Test, 75001 Paris, France');
        });

        it('should create instance successfully when constructor is called with minimal required fields', () => {
            const data = {
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
            };

            const dto = new CreateCompanyDto(data);

            expect(dto.email).toBe('test@example.com');
            expect(dto.password).toBe('Password123!');
            expect(dto.name).toBe('Test Company');
            expect(dto.siretNumber).toBeUndefined();
            expect(dto.nafCode).toBeUndefined();
            expect(dto.structureType).toBeUndefined();
            expect(dto.legalStatus).toBeUndefined();
        });
    });

    describe('validation', () => {
        describe('email field', () => {
            it('should pass validation when email is correct', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when email format is invalid', async () => {
                const dto = new CreateCompanyDto({
                    email: 'invalid-email',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0].property).toBe('email');
                expect(errors[0].constraints).toHaveProperty('isEmail');
            });

            it('should fail validation when email is empty', async () => {
                const dto = new CreateCompanyDto({
                    role: 'COMPANY' as any,
                    email: '',
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors[0].property).toBe('email');
            });

            it('should fail validation when email is missing', async () => {
                const dto = new CreateCompanyDto({
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const emailError = errors.find((e) => e.property === 'email');
                expect(emailError).toBeDefined();
            });

            it('should fail validation when email is null', async () => {
                const dto = new CreateCompanyDto({
                    role: 'COMPANY' as any,
                    email: null as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const emailError = errors.find((e) => e.property === 'email');
                expect(emailError).toBeDefined();
            });

            it('should fail validation when email is undefined', async () => {
                const dto = new CreateCompanyDto({
                    role: 'COMPANY' as any,
                    email: undefined as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const emailError = errors.find((e) => e.property === 'email');
                expect(emailError).toBeDefined();
            });

            it('should pass validation when using various valid email formats', async () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@example.com',
                    'user+tag@example.co.uk',
                    'test123@test-domain.com',
                ];

                for (const email of validEmails) {
                    const dto = new CreateCompanyDto({
                        role: 'COMPANY' as any,
                        email,
                        password: 'Password123!',
                        name: 'Test Company',
                    });

                    const errors = await validate(dto);
                    expect(errors.length).toBe(0);
                }
            });
        });

        describe('password field', () => {
            it('should pass validation when password is strong', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when password has no uppercase letters', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
                expect(passwordError?.constraints).toHaveProperty('isStrongPassword');
            });

            it('should fail validation when password has no lowercase letters', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'PASSWORD123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password has no number', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password has no symbol', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password is too short', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Pass1!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password is empty', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: '',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
            });

            it('should fail validation when password is missing', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    name: 'Test Company',
                } as any);

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const passwordError = errors.find((e) => e.property === 'password');
                expect(passwordError).toBeDefined();
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
                    const dto = new CreateCompanyDto({
                        email: 'test@example.com',
                        role: 'COMPANY' as any,
                        password,
                        name: 'Test Company',
                    });

                    const errors = await validate(dto);
                    expect(errors.length).toBe(0);
                }
            });
        });

        describe('name field', () => {
            it('should pass validation when name is valid', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when name is empty', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const nameError = errors.find((e) => e.property === 'name');
                expect(nameError).toBeDefined();
            });

            it('should fail validation when name is missing', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                } as any);

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const nameError = errors.find((e) => e.property === 'name');
                expect(nameError).toBeDefined();
            });

            it('should fail validation when name is not a string', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 123 as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const nameError = errors.find((e) => e.property === 'name');
                expect(nameError).toBeDefined();
            });

            it('should pass validation when name is long but valid', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'A'.repeat(100),
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });

        describe('optional string fields', () => {
            it('should pass validation when optional fields are undefined', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when siretNumber is valid', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                    siretNumber: '12345678901234',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when siretNumber is not a string', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                    siretNumber: 123 as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const siretError = errors.find((e) => e.property === 'siretNumber');
                expect(siretError).toBeDefined();
            });

            it('should pass validation when nafCode is valid', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                    nafCode: NafCode.NAF_62_02A,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should pass validation when all optional address fields are provided', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                    address: '10 Rue de Test, 75001 Paris, France',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });

            it('should fail validation when address fields are not strings', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                    address: 10 as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const addressError = errors.find((e) => e.property === 'address');
                expect(addressError).toBeDefined();
            });
        });

        describe('structureType field', () => {
            it('should pass validation when structureType is valid', async () => {
                for (const structureType of Object.values(StructureType)) {
                    const dto = new CreateCompanyDto({
                        email: 'test@example.com',
                        role: 'COMPANY' as any,
                        password: 'Password123!',
                        name: 'Test Company',
                        structureType: structureType,
                    });

                    const errors = await validate(dto);
                    expect(errors.length).toBe(0);
                }
            });

            it('should fail validation when structureType is invalid', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                    structureType: 'InvalidType' as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const structureTypeError = errors.find((e) => e.property === 'structureType');
                expect(structureTypeError).toBeDefined();
                expect(structureTypeError?.constraints).toHaveProperty('isEnum');
            });

            it('should pass validation when structureType is undefined', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });

        describe('legalStatus field', () => {
            it('should pass validation when legalStatus is valid', async () => {
                for (const legalStatus of Object.values(LegalStatus)) {
                    const dto = new CreateCompanyDto({
                        email: 'test@example.com',
                        role: 'COMPANY' as any,
                        password: 'Password123!',
                        name: 'Test Company',
                        legalStatus: legalStatus,
                    });

                    const errors = await validate(dto);
                    expect(errors.length).toBe(0);
                }
            });

            it('should fail validation when legalStatus is invalid', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                    legalStatus: 'InvalidStatus' as any,
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const legalStatusError = errors.find((e) => e.property === 'legalStatus');
                expect(legalStatusError).toBeDefined();
                expect(legalStatusError?.constraints).toHaveProperty('isEnum');
            });

            it('should pass validation when legalStatus is undefined', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });

        describe('multiple field validation errors', () => {
            it('should return multiple validation errors when multiple fields are invalid', async () => {
                const dto = new CreateCompanyDto({
                    email: 'invalid-email',
                    role: 'COMPANY' as any,
                    password: 'weak',
                    name: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);

                const properties = errors.map((e) => e.property);
                expect(properties).toContain('email');
                expect(properties).toContain('password');
                expect(properties).toContain('name');
            });
        });

        describe('edge cases', () => {
            it('should fail validation when siretNumber is empty string', async () => {
                const dto = new CreateCompanyDto({
                    email: 'test@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Test Company',
                    siretNumber: '',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const siretError = errors.find((e) => e.property === 'siretNumber');
                expect(siretError).toBeDefined();
            });

            it('should fail validation when email contains leading or trailing whitespace', async () => {
                const dto = new CreateCompanyDto({
                    email: '  test@example.com  ',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: '  Test Company  ',
                });

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const emailError = errors.find((e) => e.property === 'email');
                expect(emailError).toBeDefined();
            });

            it('should pass validation when DTO contains all fields', async () => {
                const dto = new CreateCompanyDto({
                    email: 'complete@example.com',
                    role: 'COMPANY' as any,
                    password: 'Password123!',
                    name: 'Complete Company',
                    siretNumber: '12345678901234',
                    nafCode: NafCode.NAF_62_02A,
                    structureType: StructureType.PrivateCompany,
                    legalStatus: LegalStatus.SARL,
                    address: '10 Rue Complete, 75001 Paris, France',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });
    });
});
