import { validate } from 'class-validator';
import { EmailDto, VerifyOtpDto, ResetPasswordDto } from '../../../../src/mailer/dto/mailer.dto';

describe('Mailer DTOs', () => {
    describe('EmailDto', () => {
        it('should pass validation with valid email', async () => {
            const dto = new EmailDto();
            dto.email = 'user@example.com';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with invalid email format', async () => {
            const dto = new EmailDto();
            dto.email = 'invalid-email';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('email');
            expect(errors[0].constraints).toHaveProperty('isEmail');
        });

        it('should fail validation with empty email', async () => {
            const dto = new EmailDto();
            dto.email = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('email');
        });

        it('should fail validation with missing email', async () => {
            const dto = new EmailDto();

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('email');
        });

        it('should normalize email to lowercase', () => {
            const dto = new EmailDto();
            dto.email = 'User@Example.COM';

            expect(dto.email.toLowerCase()).toBe('user@example.com');
        });
    });

    describe('VerifyOtpDto', () => {
        it('should pass validation with valid email and 6-digit OTP', async () => {
            const dto = new VerifyOtpDto();
            dto.email = 'user@example.com';
            dto.otp = '123456';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with OTP shorter than 6 characters', async () => {
            const dto = new VerifyOtpDto();
            dto.email = 'user@example.com';
            dto.otp = '12345';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const otpError = errors.find((e) => e.property === 'otp');
            expect(otpError).toBeDefined();
            expect(otpError?.constraints).toHaveProperty('isLength');
        });

        it('should fail validation with OTP longer than 6 characters', async () => {
            const dto = new VerifyOtpDto();
            dto.email = 'user@example.com';
            dto.otp = '1234567';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const otpError = errors.find((e) => e.property === 'otp');
            expect(otpError).toBeDefined();
            expect(otpError?.constraints).toHaveProperty('isLength');
        });

        it('should fail validation with non-string OTP', async () => {
            const dto = new VerifyOtpDto();
            dto.email = 'user@example.com';
            dto.otp = 123456 as any;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const otpError = errors.find((e) => e.property === 'otp');
            expect(otpError).toBeDefined();
        });

        it('should fail validation with missing OTP', async () => {
            const dto = new VerifyOtpDto();
            dto.email = 'user@example.com';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const otpError = errors.find((e) => e.property === 'otp');
            expect(otpError).toBeDefined();
        });

        it('should fail validation with invalid email', async () => {
            const dto = new VerifyOtpDto();
            dto.email = 'invalid-email';
            dto.otp = '123456';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((e) => e.property === 'email');
            expect(emailError).toBeDefined();
        });
    });

    describe('ResetPasswordDto', () => {
        it('should pass validation with valid data and strong password', async () => {
            const dto = new ResetPasswordDto();
            dto.email = 'user@example.com';
            dto.otp = '123456';
            dto.newPassword = 'SecurePass123!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with weak password (no uppercase)', async () => {
            const dto = new ResetPasswordDto();
            dto.email = 'user@example.com';
            dto.otp = '123456';
            dto.newPassword = 'weakpass123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'newPassword');
            expect(passwordError).toBeDefined();
            expect(passwordError?.constraints).toHaveProperty('isStrongPassword');
        });

        it('should fail validation with weak password (no lowercase)', async () => {
            const dto = new ResetPasswordDto();
            dto.email = 'user@example.com';
            dto.otp = '123456';
            dto.newPassword = 'WEAKPASS123!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'newPassword');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation with weak password (no numbers)', async () => {
            const dto = new ResetPasswordDto();
            dto.email = 'user@example.com';
            dto.otp = '123456';
            dto.newPassword = 'WeakPassword!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'newPassword');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation with weak password (no symbols)', async () => {
            const dto = new ResetPasswordDto();
            dto.email = 'user@example.com';
            dto.otp = '123456';
            dto.newPassword = 'WeakPassword123';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'newPassword');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation with password shorter than 8 characters', async () => {
            const dto = new ResetPasswordDto();
            dto.email = 'user@example.com';
            dto.otp = '123456';
            dto.newPassword = 'Pass1!';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'newPassword');
            expect(passwordError).toBeDefined();
        });

        it('should fail validation with missing newPassword', async () => {
            const dto = new ResetPasswordDto();
            dto.email = 'user@example.com';
            dto.otp = '123456';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((e) => e.property === 'newPassword');
            expect(passwordError).toBeDefined();
        });

        it('should accept various strong password formats', async () => {
            const strongPasswords = ['MyP@ssw0rd', 'C0mpl3x!Pass', 'Str0ng#2024', 'S3cur3_Pass!', 'P@ssw0rd123'];

            for (const password of strongPasswords) {
                const dto = new ResetPasswordDto();
                dto.email = 'user@example.com';
                dto.otp = '123456';
                dto.newPassword = password;

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            }
        });
    });
});
