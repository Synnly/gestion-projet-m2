import { validate } from 'class-validator';
import { LoginDto } from '../../../../src/user/dto/login.dto';

describe('LoginDto', () => {
    describe('Validation', () => {
        it('should pass validation when all fields are valid', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with different valid credentials', async () => {
            const dto = new LoginDto();
            dto.email = 'user@domain.com';
            dto.password = 'AnotherPassword456!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with complex email', async () => {
            const dto = new LoginDto();
            dto.email = 'user.name+tag@sub.domain.com';
            dto.password = 'ComplexPassword789!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Email validation', () => {
        it('should fail validation when email is missing', async () => {
            const dto = new LoginDto();
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
            expect(emailError?.constraints?.isEmail).toBeDefined();
        });

        it('should fail validation when email is invalid format', async () => {
            const dto = new LoginDto();
            dto.email = 'invalid-email';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
            expect(emailError?.constraints?.isEmail).toBeDefined();
        });

        it('should fail validation when email is empty string', async () => {
            const dto = new LoginDto();
            dto.email = '';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail validation when email has no domain', async () => {
            const dto = new LoginDto();
            dto.email = 'invalid@';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail validation when email has no @', async () => {
            const dto = new LoginDto();
            dto.email = 'invalidemail.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should pass validation with standard email format', async () => {
            const dto = new LoginDto();
            dto.email = 'user@example.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with email containing dots', async () => {
            const dto = new LoginDto();
            dto.email = 'first.last@example.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with email containing numbers', async () => {
            const dto = new LoginDto();
            dto.email = 'user123@example456.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with email containing plus sign', async () => {
            const dto = new LoginDto();
            dto.email = 'user+tag@example.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Password validation', () => {
        it('should fail validation when password is missing', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password is too short', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'Short1!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
            expect(passwordError?.constraints?.isStrongPassword).toBeDefined();
        });

        it('should fail validation when password lacks uppercase', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'weakpassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password lacks lowercase', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'WEAKPASSWORD123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password lacks numbers', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'WeakPassword!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password lacks symbols', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'WeakPassword123';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password is empty string', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should pass validation when password meets all requirements', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'StrongPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with minimum length password', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'Passw0!d'; // Exactly 8 characters

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with complex password', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'C0mpl3x!P@ssw0rd#2024';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with password containing multiple symbols', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'P@ssw0rd!#$%^&*';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Multiple fields validation', () => {
        it('should fail validation when both fields are missing', async () => {
            const dto = new LoginDto();

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('email');
            expect(errorProperties).toContain('password');
        });

        it('should fail validation when both fields are invalid', async () => {
            const dto = new LoginDto();
            dto.email = 'invalid-email';
            dto.password = 'weak';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('email');
            expect(errorProperties).toContain('password');
        });

        it('should fail validation when both fields are empty strings', async () => {
            const dto = new LoginDto();
            dto.email = '';
            dto.password = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('email');
            expect(errorProperties).toContain('password');
        });

        it('should pass validation when both fields are valid', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle very long valid email', async () => {
            const dto = new LoginDto();
            dto.email = 'very.long.email.address.with.many.dots@subdomain.example.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle very long valid password', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'VeryLongPassword123!WithManyCharactersAndSymbols#$%';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle email with subdomain', async () => {
            const dto = new LoginDto();
            dto.email = 'user@mail.subdomain.example.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle email with hyphen in domain', async () => {
            const dto = new LoginDto();
            dto.email = 'user@my-domain.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle password with all types of symbols', async () => {
            const dto = new LoginDto();
            dto.email = 'valid@example.com';
            dto.password = 'P@ssw0rd!#$%^&*()_+-=';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle email with uppercase letters', async () => {
            const dto = new LoginDto();
            dto.email = 'User@Example.COM';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Security scenarios', () => {
        it('should validate strong password for login', async () => {
            const dto = new LoginDto();
            dto.email = 'admin@company.com';
            dto.password = 'Str0ng!AdminP@ss';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject weak password even for valid email', async () => {
            const dto = new LoginDto();
            dto.email = 'admin@company.com';
            dto.password = 'password';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should reject common patterns without numbers', async () => {
            const dto = new LoginDto();
            dto.email = 'user@example.com';
            dto.password = 'Password!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should accept complex secure password', async () => {
            const dto = new LoginDto();
            dto.email = 'secure@example.com';
            dto.password = 'MyS3cur3!P@ssw0rd#2024';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
