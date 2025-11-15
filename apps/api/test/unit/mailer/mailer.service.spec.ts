import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailerService } from '../../../src/mailer/mailer.service';
import { User, UserDocument } from '../../../src/user/user.schema';
import * as bcrypt from 'bcrypt';

describe('MailerService', () => {
    let service: MailerService;
    let nestMailerService: NestMailerService;
    let userModel: Model<UserDocument>;
    let configService: ConfigService;

    const mockNestMailerService = {
        sendMail: jest.fn(),
    };

    const mockUserModel = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const config = {
                MAIL_USER: 'test@example.com',
                MAIL_FROM_NAME: 'Test App',
                MAIL_FROM_EMAIL: 'noreply@example.com',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailerService,
                {
                    provide: NestMailerService,
                    useValue: mockNestMailerService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: getModelToken(User.name),
                    useValue: mockUserModel,
                },
            ],
        }).compile();

        service = module.get<MailerService>(MailerService);
        nestMailerService = module.get<NestMailerService>(NestMailerService);
        userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
        configService = module.get<ConfigService>(ConfigService);

        jest.clearAllMocks();
    });

    it('should be defined when service is instantiated', () => {
        expect(service).toBeDefined();
    });

    describe('sendVerificationEmail', () => {
        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
            emailVerificationCode: null,
            emailVerificationExpires: null,
            emailVerificationAttempts: 0,
            otpRequestCount: 0,
            lastOtpRequestAt: null,
            save: jest.fn(),
        };

        it('should send verification email with generated OTP when user exists and no OTP provided', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockNestMailerService.sendMail.mockResolvedValue(true);
            mockUser.save.mockResolvedValue(mockUser);

            const result = await service.sendVerificationEmail('user@example.com');

            expect(result).toBe(true);
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
            expect(mockUser.save).toHaveBeenCalled();
            expect(mockUser.emailVerificationCode).not.toBeNull();
            expect(mockUser.emailVerificationExpires).toBeInstanceOf(Date);
            expect(mockUser.emailVerificationAttempts).toBe(0);
            expect(mockNestMailerService.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'Confirm your account',
                    template: 'signup-confirmation',
                    from: '"Test App" <noreply@example.com>',
                    context: expect.objectContaining({
                        otp: expect.any(String),
                        fromName: 'Test App',
                    }),
                }),
            );
        });

        it('should send verification email with provided OTP when user exists and OTP is provided', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockNestMailerService.sendMail.mockResolvedValue(true);
            mockUser.save.mockResolvedValue(mockUser);

            await service.sendVerificationEmail('user@example.com', '123456');

            expect(mockNestMailerService.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: expect.objectContaining({
                        otp: '123456',
                    }),
                }),
            );
        });

        it('should throw User not found error when user does not exist in database', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            await expect(service.sendVerificationEmail('nonexistent@example.com')).rejects.toThrow('User not found');
        });

        it('should throw rate limit error when user has requested 5 OTPs within the last hour', async () => {
            const rateLimitedUser = {
                ...mockUser,
                otpRequestCount: 5,
                lastOtpRequestAt: new Date(),
                save: jest.fn(),
            };
            mockUserModel.findOne.mockResolvedValue(rateLimitedUser);

            await expect(service.sendVerificationEmail('user@example.com')).rejects.toThrow(
                'OTP rate limit exceeded. Try again later.',
            );
        });

        it('should reset rate limit and allow new OTP request when 1 hour window has passed since last request', async () => {
            const oldDate = new Date();
            oldDate.setHours(oldDate.getHours() - 2);

            const userWithOldRequests = {
                ...mockUser,
                otpRequestCount: 5,
                lastOtpRequestAt: oldDate,
                save: jest.fn(),
            };
            mockUserModel.findOne.mockResolvedValue(userWithOldRequests);
            mockNestMailerService.sendMail.mockResolvedValue(true);
            userWithOldRequests.save.mockResolvedValue(userWithOldRequests);

            const result = await service.sendVerificationEmail('user@example.com');

            expect(result).toBe(true);
            expect(userWithOldRequests.otpRequestCount).toBe(1);
        });
    });

    describe('sendPasswordResetEmail', () => {
        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
            passwordResetCode: null,
            passwordResetExpires: null,
            passwordResetAttempts: 0,
            otpRequestCount: 0,
            lastOtpRequestAt: null,
            save: jest.fn(),
        };

        it('should send password reset email with generated OTP', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockNestMailerService.sendMail.mockResolvedValue(true);
            mockUser.save.mockResolvedValue(mockUser);

            const result = await service.sendPasswordResetEmail('user@example.com');

            expect(result).toBe(true);
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
            expect(mockUser.save).toHaveBeenCalled();
            expect(mockUser.passwordResetCode).not.toBeNull();
            expect(mockUser.passwordResetExpires).toBeInstanceOf(Date);
            expect(mockUser.passwordResetAttempts).toBe(0);
            expect(mockNestMailerService.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'Password reset request',
                    template: 'reset-password',
                    from: '"Test App" <noreply@example.com>',
                }),
            );
        });

        it('should throw error when user not found', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            await expect(service.sendPasswordResetEmail('nonexistent@example.com')).rejects.toThrow('User not found');
        });
    });

    describe('verifySignupOtp', () => {
        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
            emailVerificationCode: null as string | null,
            emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
            emailVerificationAttempts: 0,
            isVerified: false,
            save: jest.fn(),
        };

        beforeEach(async () => {
            const hashedOtp = await bcrypt.hash('123456', 10);
            mockUser.emailVerificationCode = hashedOtp;
        });

        it('should verify valid OTP and mark user as verified', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockUser.save.mockResolvedValue(mockUser);

            const result = await service.verifySignupOtp('user@example.com', '123456');

            expect(result).toBe(true);
            expect(mockUser.isVerified).toBe(true);
            expect(mockUser.emailVerificationCode).toBeNull();
            expect(mockUser.emailVerificationExpires).toBeNull();
            expect(mockUser.emailVerificationAttempts).toBe(0);
        });

        it('should throw error when user not found', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            await expect(service.verifySignupOtp('nonexistent@example.com', '123456')).rejects.toThrow(
                'User not found',
            );
        });

        it('should throw error when no verification code is set', async () => {
            const userWithoutCode = {
                ...mockUser,
                emailVerificationCode: null,
                emailVerificationExpires: null,
            };
            mockUserModel.findOne.mockResolvedValue(userWithoutCode);

            await expect(service.verifySignupOtp('user@example.com', '123456')).rejects.toThrow(
                'No verification code set',
            );
        });

        it('should throw error when OTP is expired', async () => {
            const expiredUser = {
                ...mockUser,
                emailVerificationCode: await bcrypt.hash('123456', 10),
                emailVerificationExpires: new Date(Date.now() - 1000),
                save: jest.fn(),
            };
            mockUserModel.findOne.mockResolvedValue(expiredUser);
            expiredUser.save.mockResolvedValue(expiredUser);

            await expect(service.verifySignupOtp('user@example.com', '123456')).rejects.toThrow('OTP expired');
        });

        it('should increment attempts counter on invalid OTP', async () => {
            const userWithCode = {
                ...mockUser,
                emailVerificationCode: await bcrypt.hash('123456', 10),
                emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
                save: jest.fn(),
            };
            mockUserModel.findOne.mockResolvedValue(userWithCode);
            userWithCode.save.mockResolvedValue(userWithCode);

            await expect(service.verifySignupOtp('user@example.com', '999999')).rejects.toThrow('Invalid OTP');

            expect(userWithCode.emailVerificationAttempts).toBe(1);
            expect(userWithCode.save).toHaveBeenCalled();
        });

        it('should invalidate OTP after 5 failed attempts', async () => {
            const userWithAttempts = {
                ...mockUser,
                emailVerificationCode: await bcrypt.hash('123456', 10),
                emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
                emailVerificationAttempts: 5, // Already at max
                save: jest.fn(),
            };
            mockUserModel.findOne.mockResolvedValue(userWithAttempts);
            userWithAttempts.save.mockResolvedValue(userWithAttempts);

            await expect(service.verifySignupOtp('user@example.com', '999999')).rejects.toThrow(
                'Too many verification attempts. Please request a new code.',
            );

            expect(userWithAttempts.emailVerificationCode).toBeNull();
            expect(userWithAttempts.emailVerificationExpires).toBeNull();
        });
    });

    describe('verifyPasswordResetOtp', () => {
        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
            passwordResetCode: null as string | null,
            passwordResetExpires: new Date(Date.now() + 5 * 60 * 1000),
            passwordResetAttempts: 0,
            save: jest.fn(),
        };

        beforeEach(async () => {
            const hashedOtp = await bcrypt.hash('123456', 10);
            mockUser.passwordResetCode = hashedOtp;
        });

        it('should verify valid OTP and return user', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockUser.save.mockResolvedValue(mockUser);

            const result = await service.verifyPasswordResetOtp('user@example.com', '123456');

            expect(result).toBe(mockUser);
            expect(mockUser.passwordResetCode).toBeNull();
            expect(mockUser.passwordResetExpires).toBeNull();
            expect(mockUser.passwordResetAttempts).toBe(0);
        });

        it('should throw error when OTP is expired', async () => {
            const expiredUser = {
                ...mockUser,
                passwordResetCode: await bcrypt.hash('123456', 10),
                passwordResetExpires: new Date(Date.now() - 1000),
                save: jest.fn(),
            };
            mockUserModel.findOne.mockResolvedValue(expiredUser);
            expiredUser.save.mockResolvedValue(expiredUser);

            await expect(service.verifyPasswordResetOtp('user@example.com', '123456')).rejects.toThrow('OTP expired');
        });

        it('should throw error when user not found', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            await expect(service.verifyPasswordResetOtp('nonexistent@example.com', '123456')).rejects.toThrow(
                'User not found',
            );
        });

        it('should throw error when no password reset code is set', async () => {
            const userWithoutCode = {
                ...mockUser,
                passwordResetCode: null,
                passwordResetExpires: null,
            };
            mockUserModel.findOne.mockResolvedValue(userWithoutCode);

            await expect(service.verifyPasswordResetOtp('user@example.com', '123456')).rejects.toThrow(
                'No password reset code set',
            );
        });
    });

    describe('sendInfoEmail', () => {
        it('should send info email with title and message', async () => {
            mockNestMailerService.sendMail.mockResolvedValue(true);

            const result = await service.sendInfoEmail('user@example.com', 'Test Title', 'Test Message');

            expect(result).toBe(true);
            expect(mockNestMailerService.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'Test Title',
                    template: 'info-message',
                    from: '"Test App" <noreply@example.com>',
                    context: {
                        title: 'Test Title',
                        message: 'Test Message',
                        fromName: 'Test App',
                    },
                }),
            );
        });
    });

    describe('sendCustomTemplateEmail', () => {
        it('should send email with custom template', async () => {
            mockNestMailerService.sendMail.mockResolvedValue(true);

            await service.sendCustomTemplateEmail('user@example.com', 'finish-verif');

            expect(mockNestMailerService.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user@example.com',
                    subject: 'Notification from Test App',
                    template: 'finish-verif',
                    from: '"Test App" <noreply@example.com>',
                    context: {
                        fromName: 'Test App',
                    },
                }),
            );
        });
    });

    describe('updatePassword', () => {
        const mockUser = {
            _id: '507f1f77bcf86cd799439011',
            email: 'user@example.com',
            password: 'oldHashedPassword',
            save: jest.fn(),
        };

        it('should update user password', async () => {
            mockUserModel.findOne.mockResolvedValue(mockUser);
            mockUser.save.mockResolvedValue(mockUser);

            await service.updatePassword('user@example.com', 'NewSecurePassword123!');

            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
            expect(mockUser.password).toBe('NewSecurePassword123!');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should throw error when user not found', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            await expect(service.updatePassword('nonexistent@example.com', 'NewPassword123!')).rejects.toThrow(
                'User not found',
            );
        });
    });
});
