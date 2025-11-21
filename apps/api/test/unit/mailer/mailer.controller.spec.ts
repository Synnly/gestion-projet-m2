import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MailerController } from '../../../src/mailer/mailer.controller';
import { MailerService } from '../../../src/mailer/mailer.service';
import { AuthGuard } from '../../../src/auth/auth.guard';

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

            await expect(controller.forgotPassword({ email: 'nonexistent@example.com' })).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('should throw BadRequestException when rate limit exceeded', async () => {
            mockMailerService.sendPasswordResetEmail.mockRejectedValue(
                new Error('OTP rate limit exceeded. Try again later.'),
            );

            await expect(controller.forgotPassword({ email: 'user@example.com' })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('should throw BadRequestException for generic errors', async () => {
            mockMailerService.sendPasswordResetEmail.mockRejectedValue(new Error('Some other error'));

            await expect(controller.forgotPassword({ email: 'user@example.com' })).rejects.toThrow(
                'Failed to send password reset email',
            );
        });
    });

    describe('resetPassword', () => {
        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
        };

        it('should reset password successfully (OTP already verified)', async () => {
            mockMailerService.updatePassword.mockResolvedValue(undefined);

            const result = await controller.resetPassword({
                email: 'user@example.com',
                otp: '123456', // old clients may still send otp but controller ignores it
                newPassword: 'NewSecurePass123!',
            });

            expect(result).toEqual({
                success: true,
                message: 'Password successfully reset',
            });
            expect(mockMailerService.verifyPasswordResetOtp).not.toHaveBeenCalled();
            expect(mockMailerService.updatePassword).toHaveBeenCalledWith('user@example.com', 'NewSecurePass123!');
        });

        it('should throw NotFoundException when user not found during update', async () => {
            mockMailerService.updatePassword.mockRejectedValue(new Error('User not found'));

            await expect(
                controller.resetPassword({
                    email: 'nonexistent@example.com',
                    otp: '123456',
                    newPassword: 'NewSecurePass123!',
                }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('should throw BadRequestException when password reset not verified', async () => {
            mockMailerService.updatePassword.mockRejectedValue(
                new Error('Password reset not verified. Please verify OTP first.'),
            );

            await expect(
                controller.resetPassword({
                    email: 'user@example.com',
                    otp: '123456',
                    newPassword: 'NewSecurePass123!',
                }),
            ).rejects.toThrow('Password reset not verified. Please verify OTP first.');
        });

        it('should throw BadRequestException when validation expired', async () => {
            mockMailerService.updatePassword.mockRejectedValue(
                new Error('Password reset validation expired. Please verify OTP again.'),
            );

            await expect(
                controller.resetPassword({
                    email: 'user@example.com',
                    otp: '123456',
                    newPassword: 'NewSecurePass123!',
                }),
            ).rejects.toThrow('Password reset validation expired. Please verify OTP again.');
        });

        it('should throw generic BadRequestException for unknown errors in resetPassword', async () => {
            mockMailerService.updatePassword.mockRejectedValue(new Error('Database connection failed'));

            await expect(
                controller.resetPassword({
                    email: 'user@example.com',
                    otp: '123456',
                    newPassword: 'NewSecurePass123!',
                }),
            ).rejects.toThrow('Failed to reset password');
        });
    });

    describe('verifyOtp', () => {
        it('should verify OTP successfully', async () => {
            mockMailerService.verifyPasswordResetOtp.mockResolvedValue(true);

            const result = await controller.verifyOtp({ email: 'user@example.com', otp: '123456' });

            expect(result).toEqual({ success: true, message: 'OTP successfully verified' });
            expect(mockMailerService.verifyPasswordResetOtp).toHaveBeenCalledWith('user@example.com', '123456');
        });

        it('should map errors correctly when verification fails', async () => {
            mockMailerService.verifyPasswordResetOtp.mockRejectedValue(new Error('Invalid OTP'));

            await expect(controller.verifyOtp({ email: 'user@example.com', otp: '000000' })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('should map "too many attempts" error to BadRequestException', async () => {
            mockMailerService.verifyPasswordResetOtp.mockRejectedValue(
                new Error('Too many verification attempts. Please request a new code.'),
            );

            await expect(controller.verifyOtp({ email: 'user@example.com', otp: '000000' })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('should throw NotFoundException when user not found in verifyOtp', async () => {
            mockMailerService.verifyPasswordResetOtp.mockRejectedValue(new Error('User not found'));

            await expect(controller.verifyOtp({ email: 'nonexistent@example.com', otp: '123456' })).rejects.toThrow(
                'No account found with this email',
            );
        });

        it('should throw generic BadRequestException for unknown errors in verifyOtp', async () => {
            mockMailerService.verifyPasswordResetOtp.mockRejectedValue(new Error('Some unknown error'));

            await expect(controller.verifyOtp({ email: 'user@example.com', otp: '123456' })).rejects.toThrow(
                'Failed to verify OTP',
            );
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

            await expect(controller.sendVerification({ email: 'nonexistent@example.com' })).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('should throw BadRequestException when rate limit is exceeded', async () => {
            mockMailerService.sendVerificationEmail.mockRejectedValue(
                new Error('OTP rate limit exceeded. Try again later.'),
            );

            await expect(controller.sendVerification({ email: 'user@example.com' })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('should throw BadRequestException for generic errors', async () => {
            mockMailerService.sendVerificationEmail.mockRejectedValue(new Error('Some other error'));

            await expect(controller.sendVerification({ email: 'user@example.com' })).rejects.toThrow(
                'Failed to send verification email',
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
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('should throw BadRequestException when OTP is expired', async () => {
            mockMailerService.verifySignupOtp.mockRejectedValue(new Error('OTP expired'));

            await expect(
                controller.verifyAccount({
                    email: 'user@example.com',
                    otp: '123456',
                }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });

        it('should throw NotFoundException when user not found', async () => {
            mockMailerService.verifySignupOtp.mockRejectedValue(new Error('User not found'));

            await expect(
                controller.verifyAccount({
                    email: 'nonexistent@example.com',
                    otp: '123456',
                }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('should throw BadRequestException for generic errors', async () => {
            mockMailerService.verifySignupOtp.mockRejectedValue(new Error('Some other error'));

            await expect(
                controller.verifyAccount({
                    email: 'user@example.com',
                    otp: '123456',
                }),
            ).rejects.toThrow('Failed to verify account');
        });
    });

    describe('sendCustomTemplate', () => {
        it('should send custom template email successfully', async () => {
            const mockRequest = {
                user: { email: 'user@example.com' },
            };
            mockMailerService.sendCustomTemplateEmail.mockResolvedValue(undefined);

            const result = await controller.sendCustomTemplate(mockRequest as any, { templateName: 'finishVerif' });

            expect(result).toEqual({
                success: true,
                message: 'Email sent successfully using template: finishVerif',
            });
            expect(mockMailerService.sendCustomTemplateEmail).toHaveBeenCalledWith('user@example.com', 'finishVerif');
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
                controller.sendCustomTemplate(mockRequest as any, { templateName: 'finishVerif' }),
            ).rejects.toThrow();
        });

        it('should throw BadRequestException when user email is not in request', async () => {
            const mockRequest = {
                user: { email: '' },
            };

            await expect(
                controller.sendCustomTemplate(mockRequest as any, { templateName: 'finishVerif' }),
            ).rejects.toThrow('User email not found in token');
        });

        it('should throw BadRequestException for generic errors', async () => {
            const mockRequest = {
                user: { email: 'user@example.com' },
            };
            mockMailerService.sendCustomTemplateEmail.mockRejectedValue(new Error('Some other error'));

            await expect(
                controller.sendCustomTemplate(mockRequest as any, { templateName: 'finishVerif' }),
            ).rejects.toThrow('Failed to send email');
        });
    });
});

describe('MailerController - Success branches coverage', () => {
    let controller: MailerController;
    const mockSvc: Partial<MailerService> = {};

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new MailerController(mockSvc as MailerService);
    });

    it('forgotPassword success', async () => {
        mockSvc.sendPasswordResetEmail = jest.fn().mockResolvedValue(true);
        const res = await controller.forgotPassword({ email: 'a@a.com' } as any);
        expect(res.success).toBe(true);
    });

    it('resetPassword success', async () => {
        mockSvc.verifyPasswordResetOtp = jest.fn().mockResolvedValue(true);
        mockSvc.updatePassword = jest.fn().mockResolvedValue(true);
        const dto = { email: 'a@a.com', otp: '000000', newPassword: 'P@ssw0rd' };
        const res = await controller.resetPassword(dto as any);
        expect(res.success).toBe(true);
    });

    it('sendVerification success', async () => {
        mockSvc.sendVerificationEmail = jest.fn().mockResolvedValue(true);
        const res = await controller.sendVerification({ email: 'a@a.com' } as any);
        expect(res.success).toBe(true);
    });

    it('verifyAccount success', async () => {
        mockSvc.verifySignupOtp = jest.fn().mockResolvedValue(true);
        const res = await controller.verifyAccount({ email: 'a@a.com', otp: '123456' } as any);
        expect(res.success).toBe(true);
    });

    it('sendCustomTemplate success', async () => {
        mockSvc.sendCustomTemplateEmail = jest.fn().mockResolvedValue(true);
        const req = { user: { email: 'a@a.com' } } as any;
        const res = await controller.sendCustomTemplate(req, { templateName: 'welcome' } as any);
        expect(res.success).toBe(true);
    });
});

describe('MailerController - Error mapping branches', () => {
    let controller: MailerController;
    const mockSvc: Partial<MailerService> = {};

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new MailerController(mockSvc as MailerService);
    });

    it('forgotPassword should translate "User not found" to NotFoundException', async () => {
        mockSvc.sendPasswordResetEmail = jest.fn().mockRejectedValue(new Error('User not found'));
        await expect(controller.forgotPassword({ email: 'a@a.com' } as any)).rejects.toThrow('No account found');
    });

    it('forgotPassword should translate rate limit error to BadRequestException', async () => {
        mockSvc.sendPasswordResetEmail = jest
            .fn()
            .mockRejectedValue(new Error('OTP rate limit exceeded. Try again later.'));
        await expect(controller.forgotPassword({ email: 'a@a.com' } as any)).rejects.toThrow('Too many requests');
    });

    it('verifyOtp should translate Invalid OTP to BadRequestException', async () => {
        mockSvc.verifyPasswordResetOtp = jest.fn().mockRejectedValue(new Error('Invalid OTP'));
        const dto = { email: 'a@a.com', otp: '000000' };
        await expect(controller.verifyOtp(dto as any)).rejects.toThrow('Invalid OTP');
    });

    it('sendVerification should translate User not found', async () => {
        mockSvc.sendVerificationEmail = jest.fn().mockRejectedValue(new Error('User not found'));
        await expect(controller.sendVerification({ email: 'a@a.com' } as any)).rejects.toThrow('No account found');
    });

    it('verifyAccount should translate OTP expired to BadRequestException', async () => {
        mockSvc.verifySignupOtp = jest.fn().mockRejectedValue(new Error('OTP expired'));
        await expect(controller.verifyAccount({ email: 'a@a.com', otp: '123456' } as any)).rejects.toThrow(
            'OTP expired',
        );
    });

    it('sendCustomTemplate should throw NotFoundException when template-related error is thrown', async () => {
        mockSvc.sendCustomTemplateEmail = jest.fn().mockRejectedValue(new Error('template not found on disk'));
        const req = { user: { email: 'a@a.com' } } as any;
        await expect(controller.sendCustomTemplate(req, { templateName: 'missing' } as any)).rejects.toThrow(
            "Template 'missing' not found",
        );
    });
});
