import { validate } from 'class-validator';
import { CreateUserDto } from '../../../../src/user/dto/create-user.dto';
import { Role } from '../../../../src/common/roles/roles.enum';

describe('CreateUserDto - decorator branches', () => {
    it('should validate role enum decorator', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = 'Password123!';
        dto.role = Role.STUDENT;

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail when role is invalid enum value', async () => {
        const dto = new CreateUserDto();
        dto.email = 'test@test.com';
        dto.password = 'Password123!';
        dto.role = 'INVALID_ROLE' as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('role');
    });

    it('should validate all Role enum values', async () => {
        for (const role of Object.values(Role)) {
            const dto = new CreateUserDto();
            dto.email = 'test@test.com';
            dto.password = 'Password123!';
            dto.role = role;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        }
    });
});

describe('CreateUserDto', () => {
    describe('Validation', () => {
        it('should pass validation when all fields are valid', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with ADMIN role', async () => {
            const dto = new CreateUserDto();
            dto.email = 'admin@example.com';
            dto.password = 'AdminPassword123!';
            dto.role = Role.ADMIN;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with STUDENT role', async () => {
            const dto = new CreateUserDto();
            dto.email = 'student@example.com';
            dto.password = 'StudentPassword123!';
            dto.role = Role.STUDENT;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with COMPANY role', async () => {
            const dto = new CreateUserDto();
            dto.email = 'company@example.com';
            dto.password = 'CompanyPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Email validation', () => {
        it('should fail validation when email is missing', async () => {
            const dto = new CreateUserDto();
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
            expect(emailError?.constraints?.isEmail).toBeDefined();
        });

        it('should fail validation when email is invalid format', async () => {
            const dto = new CreateUserDto();
            dto.email = 'invalid-email';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
            expect(emailError?.constraints?.isEmail).toBeDefined();
        });

        it('should fail validation when email is empty string', async () => {
            const dto = new CreateUserDto();
            dto.email = '';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should pass validation when email has valid format', async () => {
            const dto = new CreateUserDto();
            dto.email = 'user@domain.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with complex email format', async () => {
            const dto = new CreateUserDto();
            dto.email = 'user.name+tag@sub.domain.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Password validation', () => {
        it('should fail validation when password is missing', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password is too short', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'Short1!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
            expect(passwordError?.constraints?.isStrongPassword).toBeDefined();
        });

        it('should fail validation when password lacks uppercase', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'weakpassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password lacks lowercase', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'WEAKPASSWORD123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password lacks numbers', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'WeakPassword!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password lacks symbols', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'WeakPassword123';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation when password is empty string', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = '';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should pass validation when password meets all requirements', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'StrongPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with complex password', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'C0mpl3x!P@ssw0rd#2024';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Role validation', () => {
        it('should fail validation when role is missing', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'ValidPassword123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const roleError = errors.find((e) => e.property === 'role');
            expect(roleError).toBeDefined();
            expect(roleError?.constraints?.isEnum).toBeDefined();
        });

        it('should fail validation when role is invalid', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'ValidPassword123!';
            dto.role = 'INVALID_ROLE' as Role;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const roleError = errors.find((e) => e.property === 'role');
            expect(roleError).toBeDefined();
            expect(roleError?.constraints?.isEnum).toBeDefined();
        });

        it('should fail validation when role is empty string', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'ValidPassword123!';
            dto.role = '' as Role;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const roleError = errors.find((e) => e.property === 'role');
            expect(roleError).toBeDefined();
        });

        it('should pass validation with ADMIN role', async () => {
            const dto = new CreateUserDto();
            dto.email = 'admin@example.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.ADMIN;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with STUDENT role', async () => {
            const dto = new CreateUserDto();
            dto.email = 'student@example.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.STUDENT;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with COMPANY role', async () => {
            const dto = new CreateUserDto();
            dto.email = 'company@example.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Multiple fields validation', () => {
        it('should fail validation when all fields are missing', async () => {
            const dto = new CreateUserDto();

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('email');
            expect(errorProperties).toContain('password');
            expect(errorProperties).toContain('role');
        });

        it('should fail validation when email and password are invalid', async () => {
            const dto = new CreateUserDto();
            dto.email = 'invalid-email';
            dto.password = 'weak';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('email');
            expect(errorProperties).toContain('password');
        });

        it('should fail validation when email and role are invalid', async () => {
            const dto = new CreateUserDto();
            dto.email = 'invalid-email';
            dto.password = 'ValidPassword123!';
            dto.role = 'INVALID' as Role;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('email');
            expect(errorProperties).toContain('role');
        });

        it('should fail validation when password and role are invalid', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'weak';
            dto.role = 'INVALID' as Role;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);

            const errorProperties = errors.map((e) => e.property);
            expect(errorProperties).toContain('password');
            expect(errorProperties).toContain('role');
        });

        it('should pass validation when all fields are valid', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Edge cases', () => {
        it('should handle very long valid email', async () => {
            const dto = new CreateUserDto();
            dto.email = 'very.long.email.address.with.many.dots@subdomain.example.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle minimum length password with all requirements', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'Passw0!d'; // Exactly 8 characters
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle email with numbers', async () => {
            const dto = new CreateUserDto();
            dto.email = 'user123@example456.com';
            dto.password = 'ValidPassword123!';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle password with multiple symbols', async () => {
            const dto = new CreateUserDto();
            dto.email = 'valid@example.com';
            dto.password = 'P@ssw0rd!#$%';
            dto.role = Role.COMPANY;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
