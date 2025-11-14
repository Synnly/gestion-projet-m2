import { Test, TestingModule } from '@nestjs/testing';
import { MailerController } from '../../../src/mailer/mailer.controller';
import { MailerService } from '../../../src/mailer/mailer.service';
import { AuthGuard } from '../../../src/common/auth/auth.guard';

describe('MailerController', () => {
    let controller: MailerController;
    let service: MailerService;

    const mockMailerService = {
        sendPasswordResetEmail: jest.fn(),
        verifyPasswordResetOtp: jest.fn(),
        updatePassword: jest.fn(),
        sendVerificationEmail: jest.fn(),
        verifySignupOtp: jest.fn(),
        sendCustomTemplateEmail: jest.fn(),
        sendTestEmail: jest.fn(),
    };

    const mockAuthGuard = {
        canActivate: jest.fn(() => true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MailerController],
            providers: [
                {
                    provide: MailerService,
                    useValue: mockMailerService,
                },
                {
                    provide: AuthGuard,
                    useValue: mockAuthGuard,
                },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue(mockAuthGuard)
            .compile();

        controller = module.get<MailerController>(MailerController);
        service = module.get<MailerService>(MailerService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('forgotPassword', () => {
        it('should send password reset email successfully', async () => {
            mockMailerService.sendPasswordResetEmail.mockResolvedValue(true);

            const result = await controller.forgotPassword({ email: 'user@example.com' });

            expect(result).toEqual({
                success: true,
                message: 'Password reset code sent to your email. Valid for 5 minutes.',
            });
            expect(mockMailerService.sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com');
        });

        it('should throw NotFoundException when user not found', async () => {
            mockMailerService.sendPasswordResetEmail.mockRejectedValue(new Error('User not found'));

            await expect(controller.forgotPassword({ email: 'nonexistent@example.com' })).rejects.toThrow(
                'No account found with this email',
            );
        });
    });

    describe('resetPassword', () => {
        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
        };

        it('should reset password successfully with valid OTP', async () => {
            mockMailerService.verifyPasswordResetOtp.mockResolvedValue(mockUser);
            mockMailerService.updatePassword.mockResolvedValue(undefined);

            const result = await controller.resetPassword({
                email: 'user@example.com',
                otp: '123456',
                newPassword: 'NewSecurePass123!',
            });

            expect(result).toEqual({
                success: true,
                message: 'Password successfully reset',
            });
            expect(mockMailerService.verifyPasswordResetOtp).toHaveBeenCalledWith('user@example.com', '123456');
            expect(mockMailerService.updatePassword).toHaveBeenCalledWith('user@example.com', 'NewSecurePass123!');
        });

        it('should throw BadRequestException when OTP is invalid', async () => {
            mockMailerService.verifyPasswordResetOtp.mockRejectedValue(new Error('Invalid OTP'));

            await expect(
                controller.resetPassword({
                    email: 'user@example.com',
                    otp: '999999',
                    newPassword: 'NewSecurePass123!',
                }),
            ).rejects.toThrow('Invalid OTP');
        });

        it('should throw BadRequestException when OTP is expired', async () => {
            mockMailerService.verifyPasswordResetOtp.mockRejectedValue(new Error('OTP expired'));

            await expect(
                controller.resetPassword({
                    email: 'user@example.com',
                    otp: '123456',
                    newPassword: 'NewSecurePass123!',
                }),
            ).rejects.toThrow('OTP expired');
        });
    });

    describe('sendVerification', () => {
        it('should send verification email successfully', async () => {
            mockMailerService.sendVerificationEmail.mockResolvedValue(true);

            const result = await controller.sendVerification({ email: 'user@example.com' });

            expect(result).toEqual({
                success: true,
                message: 'Verification code sent to your email. Valid for 1 hour.',
            });
            expect(mockMailerService.sendVerificationEmail).toHaveBeenCalledWith('user@example.com');
        });

        it('should throw NotFoundException when user not found', async () => {
            mockMailerService.sendVerificationEmail.mockRejectedValue(new Error('User not found'));

            await expect(controller.sendVerification({ email: 'nonexistent@example.com' })).rejects.toThrow(
                'No account found with this email',
            );
        });

        it('should throw BadRequestException when rate limit is exceeded', async () => {
            mockMailerService.sendVerificationEmail.mockRejectedValue(
                new Error('OTP rate limit exceeded. Try again later.'),
            );

            await expect(controller.sendVerification({ email: 'user@example.com' })).rejects.toThrow(
                'Too many requests. Please try again later.',
            );
        });
    });

    describe('verifyAccount', () => {
        it('should verify account successfully with valid OTP', async () => {
            mockMailerService.verifySignupOtp.mockResolvedValue(true);

            const result = await controller.verifyAccount({
                email: 'user@example.com',
                otp: '123456',
            });

            expect(result).toEqual({
                success: true,
                message: 'Account successfully verified',
            });
            expect(mockMailerService.verifySignupOtp).toHaveBeenCalledWith('user@example.com', '123456');
        });

        it('should throw BadRequestException when OTP is invalid', async () => {
            mockMailerService.verifySignupOtp.mockRejectedValue(new Error('Invalid OTP'));

            await expect(
                controller.verifyAccount({
                    email: 'user@example.com',
                    otp: '999999',
                }),
            ).rejects.toThrow('Invalid OTP');
        });

        it('should throw BadRequestException when too many attempts', async () => {
            mockMailerService.verifySignupOtp.mockRejectedValue(
                new Error('Too many verification attempts. Please request a new code.'),
            );

            await expect(
                controller.verifyAccount({
                    email: 'user@example.com',
                    otp: '999999',
                }),
            ).rejects.toThrow();
        });
    });

    describe('sendCustomTemplate', () => {
        it('should send custom template email successfully', async () => {
            const mockRequest = {
                user: { email: 'user@example.com' },
            };
            mockMailerService.sendCustomTemplateEmail.mockResolvedValue(undefined);

            const result = await controller.sendCustomTemplate(mockRequest as any, { templateName: 'finish-verif' });

            expect(result).toEqual({
                success: true,
                message: 'Email sent successfully using template: finish-verif',
            });
            expect(mockMailerService.sendCustomTemplateEmail).toHaveBeenCalledWith('user@example.com', 'finish-verif');
        });

        it('should throw NotFoundException when template does not exist', async () => {
            const mockRequest = {
                user: { email: 'user@example.com' },
            };
            mockMailerService.sendCustomTemplateEmail.mockRejectedValue(new Error('Some template error'));

            await expect(
                controller.sendCustomTemplate(mockRequest as any, { templateName: 'non-existent' }),
            ).rejects.toThrow();
        });

        it('should return error when user is not authenticated', async () => {
            const mockRequest = {
                user: undefined,
            };

            await expect(
                controller.sendCustomTemplate(mockRequest as any, { templateName: 'finish-verif' }),
            ).rejects.toThrow();
        });
    });
});
