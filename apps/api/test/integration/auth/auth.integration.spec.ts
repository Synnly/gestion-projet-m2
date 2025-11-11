import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';

import { AuthModule } from '../../../src/auth/auth.module';
import { CompanyModule } from '../../../src/company/company.module';
import { Company, CompanyDocument } from '../../../src/company/company.schema';
import { RefreshToken, RefreshTokenDocument } from '../../../src/auth/refreshToken.schema';
import { Role } from '../../../src/common/roles/roles.enum';

describe('Auth Integration Tests', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let companyModel: Model<CompanyDocument>;
    let refreshTokenModel: Model<RefreshTokenDocument>;

    const ACCESS_TOKEN_SECRET = 'test-access-secret';
    const REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    const ACCESS_TOKEN_LIFESPAN_MINUTES = 5;
    const REFRESH_TOKEN_LIFESPAN_MINUTES = 60;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        () => ({
                            ACCESS_TOKEN_SECRET,
                            REFRESH_TOKEN_SECRET,
                            ACCESS_TOKEN_LIFESPAN_MINUTES,
                            REFRESH_TOKEN_LIFESPAN_MINUTES,
                        }),
                    ],
                }),
                MongooseModule.forRoot(uri),
                CompanyModule,
                AuthModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();

        companyModel = moduleFixture.get<Model<CompanyDocument>>(getModelToken(Company.name));
        refreshTokenModel = moduleFixture.get<Model<RefreshTokenDocument>>(getModelToken(RefreshToken.name));
    });

    afterEach(async () => {
        await companyModel.deleteMany({}).exec();
        await refreshTokenModel.deleteMany({}).exec();
    });

    afterAll(async () => {
        await app.close();
        if (mongod) await mongod.stop();
    });

    const DEFAULT_PASSWORD = 'StrongP@ss1';

    const createCompany = async (email: string, password: string = DEFAULT_PASSWORD) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        return companyModel.create({
            email,
            password: hashedPassword,
            name: 'Test Company',
            isValid: true,
        });
    };

    const loginRequest = (email: string, password: string, role: Role = Role.COMPANY) => {
        return request(app.getHttpServer()).post('/api/auth/login').send({ email, password, role });
    };

    const extractRefreshCookie = (response: any): string => {
        const cookies = response.headers['set-cookie'];
        const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
        return cookieArray.find((c: string) => c.startsWith('refreshToken='));
    };

    const expectCookieAttributes = (cookie: string) => {
        expect(cookie).toBeDefined();
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('Secure');
        expect(cookie).toContain('SameSite=Lax');
        expect(cookie).toContain('Path=/api/auth/refresh');
    };

    describe('POST /api/auth/login - Login', () => {
        it('should login successfully when valid company credentials are provided and login is called resulting in access token and refresh cookie', async () => {
            const company = await createCompany('test@company.com');

            const res = await loginRequest('test@company.com', DEFAULT_PASSWORD).expect(201);

            expect(res.text).toBeDefined();
            expect(typeof res.text).toBe('string');

            const refreshCookie = extractRefreshCookie(res);
            expectCookieAttributes(refreshCookie);

            const savedTokens = await refreshTokenModel.find({ userId: company._id }).exec();
            expect(savedTokens.length).toBe(1);
        });

        it('should return 404 when company email is not found and login is called', async () => {
            const res = await loginRequest('nonexistent@company.com', DEFAULT_PASSWORD).expect(404);
            expect(res.body.message).toContain('Company with email nonexistent@company.com not found');
        });

        it('should return 401 when password is incorrect and login is called', async () => {
            await createCompany('test@company.com', 'CorrectP@ss1');
            await loginRequest('test@company.com', 'WrongP@ss1').expect(401);
        });

        it('should return 401 when invalid role is provided and login is called', async () => {
            await createCompany('test@company.com');
            await loginRequest('test@company.com', DEFAULT_PASSWORD, Role.STUDENT).expect(401);
        });

        it('should return 400 when email is missing and login is called', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ password: DEFAULT_PASSWORD, role: Role.COMPANY })
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when password is missing and login is called', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: 'test@company.com', role: Role.COMPANY })
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when role is missing and login is called', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: 'test@company.com', password: DEFAULT_PASSWORD })
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when email format is invalid and login is called', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: 'invalid-email', password: DEFAULT_PASSWORD, role: Role.COMPANY })
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when email is empty string and login is called', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: '', password: DEFAULT_PASSWORD, role: Role.COMPANY })
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when password is empty string and login is called', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: 'test@company.com', password: '', role: Role.COMPANY })
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when role is invalid enum value and login is called', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: 'test@company.com', password: DEFAULT_PASSWORD, role: 'INVALID_ROLE' })
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should return 400 when extra non-whitelisted properties are sent and login is called', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'test@company.com',
                    password: DEFAULT_PASSWORD,
                    role: Role.COMPANY,
                    extraField: 'should-be-rejected',
                })
                .expect(400);

            expect(res.body.message).toBeDefined();
        });

        it('should store refresh token in database when login is successful', async () => {
            const company = await createCompany('test@company.com');
            await loginRequest('test@company.com', DEFAULT_PASSWORD).expect(201);

            const tokens = await refreshTokenModel.find({ userId: company._id }).exec();
            expect(tokens.length).toBe(1);
            expect(tokens[0].userId.toString()).toBe(company._id.toString());
            expect(tokens[0].expiresAt).toBeInstanceOf(Date);
        });
    });

    describe('POST /api/auth/refresh - Refresh Access Token', () => {
        it('should return new access token when valid refresh token cookie is provided and refresh is called', async () => {
            await createCompany('test@company.com');
            const loginRes = await loginRequest('test@company.com', DEFAULT_PASSWORD);
            const refreshCookie = extractRefreshCookie(loginRes);

            const res = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', refreshCookie)
                .expect(201);

            expect(res.text).toBeDefined();
            expect(typeof res.text).toBe('string');
        });

        it('should return 401 when refresh token cookie is missing and refresh is called', async () => {
            await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
        });

        it('should return 401 when refresh token is invalid and refresh is called', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', 'refreshToken=invalid-token')
                .expect(401);
        });

        it('should return 401 when refresh token is expired and refresh is called', async () => {
            const company = await createCompany('test@company.com');

            const expiredToken = await refreshTokenModel.create({
                userId: company._id,
                role: Role.COMPANY,
                expiresAt: new Date(Date.now() - 1000),
            });

            await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=expired-token-${expiredToken._id}`)
                .expect(401);
        });
    });

    describe('POST /api/auth/logout - Logout', () => {
        it('should logout successfully when valid refresh token cookie is provided and logout is called', async () => {
            const company = await createCompany('test@company.com');
            const loginRes = await loginRequest('test@company.com', DEFAULT_PASSWORD);
            const refreshCookie = extractRefreshCookie(loginRes);

            const tokensBefore = await refreshTokenModel.find({ userId: company._id }).exec();
            expect(tokensBefore.length).toBe(1);

            await request(app.getHttpServer()).post('/api/auth/logout').set('Cookie', refreshCookie).expect(201);

            const tokensAfter = await refreshTokenModel.find({ userId: company._id }).exec();
            expect(tokensAfter.length).toBe(0);
        });

        it('should return 401 when refresh token cookie is missing and logout is called', async () => {
            await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
        });

        it('should return 401 when refresh token is invalid and logout is called', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Cookie', 'refreshToken=invalid-token')
                .expect(401);
        });
    });

    describe('Integration Flow - Login -> Refresh -> Logout', () => {
        it('should complete full authentication flow when user logs in refreshes token and logs out', async () => {
            const company = await createCompany('flow@company.com');
            const loginRes = await loginRequest('flow@company.com', DEFAULT_PASSWORD).expect(201);

            expect(loginRes.text).toBeDefined();
            const refreshCookie = extractRefreshCookie(loginRes);
            expect(refreshCookie).toBeDefined();

            let tokens = await refreshTokenModel.find({ userId: company._id }).exec();
            expect(tokens.length).toBe(1);

            const refreshRes = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .set('Cookie', refreshCookie)
                .expect(201);

            expect(refreshRes.text).toBeDefined();

            tokens = await refreshTokenModel.find({ userId: company._id }).exec();
            expect(tokens.length).toBe(1);

            await request(app.getHttpServer()).post('/api/auth/logout').set('Cookie', refreshCookie).expect(201);

            tokens = await refreshTokenModel.find({ userId: company._id }).exec();
            expect(tokens.length).toBe(0);
        });

        it('should allow multiple logins from same user when user logs in multiple times resulting in multiple refresh tokens', async () => {
            const company = await createCompany('multi@company.com');

            await loginRequest('multi@company.com', DEFAULT_PASSWORD).expect(201);
            await loginRequest('multi@company.com', DEFAULT_PASSWORD).expect(201);

            const tokens = await refreshTokenModel.find({ userId: company._id }).exec();
            expect(tokens.length).toBe(2);
        });

        it('should prevent refresh after logout when user logs out and tries to refresh', async () => {
            await createCompany('prevent@company.com');
            const loginRes = await loginRequest('prevent@company.com', DEFAULT_PASSWORD).expect(201);
            const refreshCookie = extractRefreshCookie(loginRes);

            await request(app.getHttpServer()).post('/api/auth/logout').set('Cookie', refreshCookie).expect(201);
            await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', refreshCookie).expect(401);
        });
    });

    describe('Cookie Security', () => {
        it('should set httpOnly flag on refresh token cookie when login is called', async () => {
            await createCompany('security@company.com');
            const res = await loginRequest('security@company.com', DEFAULT_PASSWORD).expect(201);
            const refreshCookie = extractRefreshCookie(res);

            expect(refreshCookie).toContain('HttpOnly');
        });

        it('should set secure flag on refresh token cookie when login is called', async () => {
            await createCompany('secure@company.com');
            const res = await loginRequest('secure@company.com', DEFAULT_PASSWORD).expect(201);
            const refreshCookie = extractRefreshCookie(res);

            expect(refreshCookie).toContain('Secure');
        });

        it('should set sameSite lax on refresh token cookie when login is called', async () => {
            await createCompany('samesite@company.com');
            const res = await loginRequest('samesite@company.com', DEFAULT_PASSWORD).expect(201);
            const refreshCookie = extractRefreshCookie(res);

            expect(refreshCookie).toContain('SameSite=Lax');
        });

        it('should set correct path on refresh token cookie when login is called', async () => {
            await createCompany('path@company.com');
            const res = await loginRequest('path@company.com', DEFAULT_PASSWORD).expect(201);
            const refreshCookie = extractRefreshCookie(res);

            expect(refreshCookie).toContain('Path=/api/auth/refresh');
        });
    });
});
