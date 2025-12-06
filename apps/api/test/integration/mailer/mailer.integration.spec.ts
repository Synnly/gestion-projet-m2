import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { MailerModule } from '../../../src/mailer/mailer.module';
import { User, UserSchema } from '../../../src/user/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { Role } from '../../../src/common/roles/roles.enum';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

describe('MailerController (Integration)', () => {
    let app: INestApplication;
    let mongoServer: MongoMemoryServer;
    let userModel: Model<User>;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        const mockNestMailerService = {
            sendMail: jest.fn().mockResolvedValue(true),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),
                MongooseModule.forRoot(mongoUri),
                MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
                MailerModule,
            ],
        })
            .overrideProvider(NestMailerService)
            .useValue(mockNestMailerService)
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    return true;
                },
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

        userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

        await app.init();
    });

    afterAll(async () => {
        await app.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await userModel.deleteMany({});
    });

    describe('POST /password/forgot', () => {
        it('should send password reset email for existing user', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
            });

            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/forgot')
                .send({ email: 'test@example.com' })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: expect.stringContaining('reset'),
            });

            const user = await userModel.findOne({ email: 'test@example.com' });
            expect(user?.passwordResetCode).not.toBeNull();
            expect(user?.passwordResetExpires).toBeInstanceOf(Date);
            expect(user?.passwordResetAttempts).toBe(0);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/forgot')
                .send({ email: 'nonexistent@example.com' })
                .expect(404);

            expect(response.body).toMatchObject({
                message: 'No account found with this email',
            });
        });

        it('should validate email format', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/forgot')
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body.message).toEqual(expect.arrayContaining(['Invalid email format']));
        });

        it('should enforce rate limiting', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
            });

            // Send 5 requests successfully
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/api/mailer/password/forgot')
                    .send({ email: 'test@example.com' })
                    .expect(200);
            }

            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/forgot')
                .send({ email: 'test@example.com' })
                .expect(400);

            expect(response.body.message).toContain('Too many requests');
        });
    });

    describe('POST /password/reset', () => {
        it('should reset password with valid OTP', async () => {
            const hashedPassword = await bcrypt.hash('OldPassword123!', 10);
            const otp = '123456';
            const hashedOtp = await bcrypt.hash(otp, 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
                passwordResetCode: hashedOtp,
                passwordResetExpires: new Date(Date.now() + 5 * 60 * 1000),
                passwordResetAttempts: 0,
            });

            // First verify OTP
            await request(app.getHttpServer())
                .post('/api/mailer/password/reset/verify-otp')
                .send({ email: 'test@example.com', otp: '123456' })
                .expect(200);

            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/reset')
                .send({
                    email: 'test@example.com',
                    newPassword: 'NewPassword123!',
                })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Password successfully reset',
            });

            const user = await userModel.findOne({ email: 'test@example.com' });
            expect(user?.passwordResetCode).toBeNull();
            expect(user?.passwordResetExpires).toBeNull();

            // Verify new password works
            const isMatch = await bcrypt.compare('NewPassword123!', user!.password);
            expect(isMatch).toBe(true);
        });

        it('should reject expired OTP', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            const otp = '123456';
            const hashedOtp = await bcrypt.hash(otp, 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
                passwordResetCode: hashedOtp,
                passwordResetExpires: new Date(Date.now() - 1000), // Expired
                passwordResetAttempts: 0,
            });

            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/reset/verify-otp')
                .send({ email: 'test@example.com', otp: '123456' })
                .expect(400);

            expect(response.body.message).toContain('expired');
        });

        it('should reject invalid OTP', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            const otp = '123456';
            const hashedOtp = await bcrypt.hash(otp, 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
                passwordResetCode: hashedOtp,
                passwordResetExpires: new Date(Date.now() + 5 * 60 * 1000),
                passwordResetAttempts: 0,
            });

            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/reset/verify-otp')
                .send({ email: 'test@example.com', otp: '999999' })
                .expect(400);

            expect(response.body.message).toContain('Invalid');
        });

        it('should validate strong password requirement', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            const otp = '123456';
            const hashedOtp = await bcrypt.hash(otp, 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
                passwordResetCode: hashedOtp,
                passwordResetExpires: new Date(Date.now() + 5 * 60 * 1000),
                passwordResetAttempts: 0,
            });

            // Verify OTP first
            await request(app.getHttpServer())
                .post('/api/mailer/password/reset/verify-otp')
                .send({ email: 'test@example.com', otp: '123456' })
                .expect(200);

            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/reset')
                .send({
                    email: 'test@example.com',
                    newPassword: 'weak', // Too weak
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        it('should block after 5 failed attempts', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            const otp = '123456';
            const hashedOtp = await bcrypt.hash(otp, 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
                passwordResetCode: hashedOtp,
                passwordResetExpires: new Date(Date.now() + 5 * 60 * 1000),
                passwordResetAttempts: 0,
            });

            // 5 failed attempts (verify endpoint)
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/api/mailer/password/reset/verify-otp')
                    .send({ email: 'test@example.com', otp: '999999' })
                    .expect(400);
            }

            // Should be blocked now even if correct OTP
            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/reset/verify-otp')
                .send({ email: 'test@example.com', otp: '123456' })
                .expect(400);

            expect(response.body.message).toContain('Too many verification attempts');
        });

        it('should reject password reset without OTP verification', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
            });

            // Try to reset password without verifying OTP first
            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/reset')
                .send({
                    email: 'test@example.com',
                    newPassword: 'NewPassword123!',
                })
                .expect(400);

            expect(response.body.message).toContain('Password reset not verified');
        });

        it('should reject password reset if validation window expired', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: true,
                role: Role.STUDENT,
                passwordResetValidatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
                passwordResetValidatedExpires: new Date(Date.now() - 5 * 60 * 1000), // Expired 5 minutes ago
            });

            // Try to reset password after validation expired
            const response = await request(app.getHttpServer())
                .post('/api/mailer/password/reset')
                .send({
                    email: 'test@example.com',
                    newPassword: 'NewPassword123!',
                })
                .expect(400);

            expect(response.body.message).toContain('Password reset validation expired');
        });
    });

    describe('POST /auth/send-verification', () => {
        it('should send verification email for unverified user', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: false,
                role: Role.STUDENT,
            });

            const response = await request(app.getHttpServer())
                .post('/api/mailer/auth/send-verification')
                .send({ email: 'test@example.com' })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: expect.stringContaining('Verification code sent'),
            });

            const user = await userModel.findOne({ email: 'test@example.com' });
            expect(user?.emailVerificationCode).not.toBeNull();
            expect(user?.emailVerificationExpires).toBeInstanceOf(Date);
            expect(user?.emailVerificationAttempts).toBe(0);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/mailer/auth/send-verification')
                .send({ email: 'nonexistent@example.com' })
                .expect(404);

            expect(response.body.message).toContain('No account found');
        });
    });

    describe('POST /auth/verify', () => {
        it('should verify account with valid OTP', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            const otp = '123456';
            const hashedOtp = await bcrypt.hash(otp, 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: false,
                role: Role.STUDENT,
                emailVerificationCode: hashedOtp,
                emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
                emailVerificationAttempts: 0,
            });

            const response = await request(app.getHttpServer())
                .post('/api/mailer/auth/verify')
                .send({
                    email: 'test@example.com',
                    otp: '123456',
                })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Account successfully verified',
            });

            const user = await userModel.findOne({ email: 'test@example.com' });
            expect(user?.isVerified).toBe(true);
            expect(user?.emailVerificationCode).toBeNull();
        });

        it('should reject invalid OTP', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            const otp = '123456';
            const hashedOtp = await bcrypt.hash(otp, 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: false,
                role: Role.STUDENT,
                emailVerificationCode: hashedOtp,
                emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
                emailVerificationAttempts: 0,
            });

            const response = await request(app.getHttpServer())
                .post('/api/mailer/auth/verify')
                .send({
                    email: 'test@example.com',
                    otp: '999999',
                })
                .expect(400);

            expect(response.body.message).toContain('Invalid');
        });

        it('should reject expired OTP', async () => {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            const otp = '123456';
            const hashedOtp = await bcrypt.hash(otp, 10);

            await userModel.create({
                email: 'test@example.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                isVerified: false,
                role: Role.STUDENT,
                emailVerificationCode: hashedOtp,
                emailVerificationExpires: new Date(Date.now() - 1000), // Expired
                emailVerificationAttempts: 0,
            });

            const response = await request(app.getHttpServer())
                .post('/api/mailer/auth/verify')
                .send({
                    email: 'test@example.com',
                    otp: '123456',
                })
                .expect(400);

            expect(response.body.message).toContain('expired');
        });
    });
});
