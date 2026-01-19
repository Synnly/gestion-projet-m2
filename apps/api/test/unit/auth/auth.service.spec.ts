import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AuthService } from '../../../src/auth/auth.service';
import { RefreshToken } from '../../../src/auth/refreshToken.schema';
import { CompanyService } from '../../../src/company/company.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../../src/common/roles/roles.enum';
import * as bcrypt from 'bcrypt';
import { InvalidCredentialsException } from '../../../src/common/exceptions/invalidCredentials.exception';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../../src/user/user.schema';
import { MailerService } from '../../../src/mailer/mailer.service';

describe('AuthService', () => {
    let service: AuthService;
    const ACCESS_LIFESPAN = 5;
    const REFRESH_LIFESPAN = 60;

    let refreshTokenModel: {
        create: jest.Mock;
        findById: jest.Mock;
        findOne: jest.Mock;
        deleteOne: jest.Mock;
    };

    const mockCompanyService = {
        findByEmail: jest.fn(),
        findOne: jest.fn(),
    };

    const mockJwtService = {
        signAsync: jest.fn(),
    };

    const mockRefreshJwtService = {
        signAsync: jest.fn(),
        verify: jest.fn(),
        decode: jest.fn(),
    };

    const mockUserModel = {
        findById: jest.fn(),
        findOne: jest.fn(),
    };

    const mockMailerService = {
        sendVerificationEmail: jest.fn(),
    };

    beforeEach(async () => {
        refreshTokenModel = {
            create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
            findById: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getModelToken(RefreshToken.name),
                    useValue: refreshTokenModel,
                },
                {
                    provide: getModelToken(User.name),
                    useValue: mockUserModel,
                },
                {
                    provide: CompanyService,
                    useValue: mockCompanyService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: 'REFRESH_JWT_SERVICE',
                    useValue: mockRefreshJwtService,
                },
                {
                    provide: MailerService,
                    useValue: mockMailerService,
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key: string) => {
                            if (key === 'ACCESS_TOKEN_LIFESPAN_MINUTES') return ACCESS_LIFESPAN;
                            if (key === 'REFRESH_TOKEN_LIFESPAN_MINUTES') return REFRESH_LIFESPAN;
                            return undefined;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('constructor', () => {
        it('should throw InvalidConfigurationException when REFRESH_TOKEN_LIFESPAN_MINUTES is not configured and service is instantiated', async () => {
            const invalidConfigService = {
                get: jest.fn().mockImplementation((key: string) => {
                    if (key === 'ACCESS_TOKEN_LIFESPAN_MINUTES') return ACCESS_LIFESPAN;
                    if (key === 'REFRESH_TOKEN_LIFESPAN_MINUTES') return undefined;
                    return undefined;
                }),
            };

            await expect(
                Test.createTestingModule({
                    providers: [
                        AuthService,
                        {
                            provide: getModelToken(RefreshToken.name),
                            useValue: refreshTokenModel,
                        },
                        {
                            // Même mock pour le second module de test dans ce cas
                            provide: getModelToken(User.name),
                            useValue: mockUserModel,
                        },
                        {
                            provide: CompanyService,
                            useValue: mockCompanyService,
                        },
                        {
                            provide: JwtService,
                            useValue: mockJwtService,
                        },
                        {
                            provide: 'REFRESH_JWT_SERVICE',
                            useValue: mockRefreshJwtService,
                        },
                        {
                            provide: ConfigService,
                            useValue: invalidConfigService,
                        },
                        {
                            provide: MailerService,
                            useValue: mockMailerService,
                        },
                    ],
                }).compile(),
            ).rejects.toThrow('Refresh token lifespan is not configured');
        });
    });

    describe('login', () => {
        it('should return access and refresh tokens when company is found with valid credentials and login is called', async () => {
            const company = await createMockCompany();
            mockUserModel.findOne.mockResolvedValue(company);
            mockUserModel.findById.mockResolvedValue(company);

            const savedToken = createMockRefreshToken(company._id, 1000 * 60 * REFRESH_LIFESPAN);
            refreshTokenModel.create.mockResolvedValue(savedToken);
            refreshTokenModel.findById.mockResolvedValue(savedToken);

            mockRefreshJwtService.signAsync.mockResolvedValue('refresh-token');
            mockJwtService.signAsync.mockResolvedValue('access-token');

            const result = await service.login(company.email, company.plainPassword);

            expect(result).toEqual({ access: 'access-token', refresh: 'refresh-token' });
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: company.email });
            expect(mockRefreshJwtService.signAsync).toHaveBeenCalled();
            expect(mockJwtService.signAsync).toHaveBeenCalled();
        });

        it('should throw NotFoundException when company not found and login is called', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            await expect(service.login('notfound@test.com', 'password')).rejects.toThrow(NotFoundException);
        });

        it('should throw InvalidCredentialsException when password mismatches and login is called', async () => {
            const company = await createMockCompany();
            mockUserModel.findOne.mockResolvedValue(company);

            await expect(service.login(company.email, 'wrongPassword')).rejects.toThrow(InvalidCredentialsException);
        });
    });

    describe('generateAccessToken', () => {
        it('should throw InvalidCredentialsException when refresh token is not found and generateAccessToken is called', async () => {
            refreshTokenModel.findById.mockResolvedValue(null);

            await expect(
                (service as any).generateAccessToken(new Types.ObjectId(), 'email@test.com', new Types.ObjectId()),
            ).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when refresh token belongs to different user and generateAccessToken is called', async () => {
            const userId = new Types.ObjectId();
            const differentUserId = new Types.ObjectId();
            const tokenId = new Types.ObjectId();
            const token = createMockRefreshToken(differentUserId, 1000);
            refreshTokenModel.findById.mockResolvedValue(token);

            await expect((service as any).generateAccessToken(userId, 'email@test.com', tokenId)).rejects.toThrow(
                InvalidCredentialsException,
            );
        });

        it('should throw InvalidCredentialsException when refresh token is expired and generateAccessToken is called resulting in deleteOne being called', async () => {
            const userId = new Types.ObjectId();
            const tokenId = new Types.ObjectId();
            const expiredToken = createMockRefreshToken(userId, -1000);
            refreshTokenModel.findById.mockResolvedValue(expiredToken);

            await expect((service as any).generateAccessToken(userId, 'email@test.com', tokenId)).rejects.toThrow(
                InvalidCredentialsException,
            );
            expect(refreshTokenModel.deleteOne).toHaveBeenCalledWith({ _id: tokenId });
        });

        it('should return signed access token when refresh token is valid and generateAccessToken is called', async () => {
            const userId = new Types.ObjectId();
            const tokenId = new Types.ObjectId();
            const validToken = createMockRefreshToken(userId);
            refreshTokenModel.findById.mockResolvedValue(validToken);
            mockUserModel.findById.mockResolvedValue({ _id: userId, email: 'email@test.com', role: Role.COMPANY });
            mockJwtService.signAsync.mockResolvedValue('signed-access-token');

            const result = await (service as any).generateAccessToken(userId, 'email@test.com', tokenId);

            expect(result).toBe('signed-access-token');
            expect(mockJwtService.signAsync).toHaveBeenCalledWith(expect.objectContaining({ sub: userId }));
        });

        it('should throw InvalidCredentialsException when user not found in database and generateAccessToken is called', async () => {
            const userId = new Types.ObjectId();
            const tokenId = new Types.ObjectId();
            const validToken = createMockRefreshToken(userId);
            refreshTokenModel.findById.mockResolvedValue(validToken);
            mockUserModel.findById.mockResolvedValue(null);

            await expect((service as any).generateAccessToken(userId, 'email@test.com', tokenId)).rejects.toThrow(
                InvalidCredentialsException,
            );
        });
    });

    describe('generateRefreshToken', () => {
        it('should create and sign a refresh token when generateRefreshToken is called with valid userId and role', async () => {
            const userId = new Types.ObjectId();
            const savedToken = createMockRefreshToken(userId, 1000 * 60 * REFRESH_LIFESPAN);
            refreshTokenModel.create.mockResolvedValue(savedToken);
            mockRefreshJwtService.signAsync.mockResolvedValue('refresh-token-string');

            const result = await (service as any).generateRefreshToken(userId, Role.COMPANY);

            expect(result).toEqual({ token: 'refresh-token-string', rti: savedToken._id });
            expect(mockRefreshJwtService.signAsync).toHaveBeenCalledWith(expect.objectContaining({ sub: userId }));
        });
    });

    describe('computeExpiryDate', () => {
        it('should return expiry date when computeExpiryDate is called with minutes resulting in correct time addition', async () => {
            const minutes = 30;
            const beforeCall = new Date();
            const result = await (service as any).computeExpiryDate(minutes);
            const afterCall = new Date();

            const expectedMin = new Date(beforeCall.getTime() + minutes * 60 * 1000);
            const expectedMax = new Date(afterCall.getTime() + minutes * 60 * 1000);

            expect(result.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
            expect(result.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
        });
    });

    describe('refreshAccessToken', () => {
        it('should throw InvalidCredentialsException when verify fails and refreshAccessToken is called', async () => {
            mockRefreshJwtService.verify.mockReturnValue(false);

            await expect(service.refreshAccessToken('invalid-token')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when refresh token is not found in database and refreshAccessToken is called', async () => {
            const payload = createMockTokenPayload();
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue(null);

            await expect(service.refreshAccessToken('token')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when token is expired and refreshAccessToken is called resulting in deleteOne being called', async () => {
            const payload = createMockTokenPayload({ exp: Date.now() - 1000 });
            const expiredToken = createMockRefreshToken(payload.sub, -1000);
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue(expiredToken);

            await expect(service.refreshAccessToken('token')).rejects.toThrow(InvalidCredentialsException);
            expect(refreshTokenModel.deleteOne).toHaveBeenCalledWith({ _id: expiredToken._id });
        });

        it('should throw InvalidCredentialsException when company is not found and refreshAccessToken is called', async () => {
            const payload = createMockTokenPayload();
            const validToken = createMockRefreshToken(payload.sub, 10000);
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue(validToken);
            mockUserModel.findById.mockResolvedValue(null);

            await expect(service.refreshAccessToken('token')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when refresh token has invalid role and refreshAccessToken is called', async () => {
            const payload = createMockTokenPayload({ role: Role.STUDENT });
            const validToken = createMockRefreshToken(payload.sub, 10000);
            validToken.role = Role.STUDENT;
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue(validToken);

            await expect(service.refreshAccessToken('token')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when user role has changed since token was issued', async () => {
            const userId = new Types.ObjectId();
            const payload = createMockTokenPayload({ sub: userId, role: Role.COMPANY });
            const validToken = createMockRefreshToken(userId, 10000);
            validToken.role = Role.COMPANY; // Token was issued for COMPANY role
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue(validToken);
            // But user's current role is now ADMIN
            mockUserModel.findById.mockResolvedValue({ _id: userId, email: 'user@test.com', role: Role.ADMIN });

            await expect(service.refreshAccessToken('token')).rejects.toThrow(
                'User role has changed since refresh token was issued',
            );
        });

        it('should return new access token when all data is valid and refreshAccessToken is called', async () => {
            const companyId = new Types.ObjectId();
            const payload = createMockTokenPayload({ sub: companyId });
            const validToken = createMockRefreshToken(companyId, 10000);
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue(validToken);
            mockUserModel.findById.mockResolvedValue({ _id: companyId, email: 'company@test.com', role: Role.COMPANY });

            jest.spyOn<any, any>(service as any, 'generateAccessToken').mockResolvedValue('new-access-token');

            const result = await service.refreshAccessToken('token');

            expect(result).toBe('new-access-token');
        });
    });

    describe('logout', () => {
        it('should throw InvalidCredentialsException when verify fails and logout is called', async () => {
            mockRefreshJwtService.verify.mockReturnValue(false);

            await expect(service.logout('invalid-token')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should delete refresh token when valid token is provided and logout is called', async () => {
            const payload = createMockTokenPayload();
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);

            await service.logout('valid-token');

            expect(refreshTokenModel.deleteOne).toHaveBeenCalledWith({ _id: payload._id });
        });
    });

    describe('login - ban check', () => {
        it('should throw ForbiddenException when user is banned and login is called', async () => {
            const company = await createMockCompany();
            const banReason = 'Inappropriate behavior';
            company.ban = { reason: banReason };
            mockUserModel.findOne.mockResolvedValue(company);

            await expect(service.login(company.email, company.plainPassword)).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException with correct ban reason message when user is banned and login is called', async () => {
            const company = await createMockCompany();
            const banReason = 'Violation of terms';
            company.ban = { reason: banReason };
            mockUserModel.findOne.mockResolvedValue(company);

            try {
                await service.login(company.email, company.plainPassword);
                fail('Should have thrown ForbiddenException');
            } catch (error) {
                expect(error).toBeInstanceOf(ForbiddenException);
                expect(error.message).toContain(banReason);
                expect(error.message).toContain(company.email);
            }
        });

        it('should not throw ForbiddenException when user is not banned and login is called with valid credentials', async () => {
            const company = await createMockCompany();
            company.ban = null;
            mockUserModel.findOne.mockResolvedValue(company);
            mockUserModel.findById.mockResolvedValue(company);

            const savedToken = createMockRefreshToken(company._id, 1000 * 60 * REFRESH_LIFESPAN);
            refreshTokenModel.create.mockResolvedValue(savedToken);
            refreshTokenModel.findById.mockResolvedValue(savedToken);

            mockRefreshJwtService.signAsync.mockResolvedValue('refresh-token');
            mockJwtService.signAsync.mockResolvedValue('access-token');

            const result = await service.login(company.email, company.plainPassword);

            expect(result).toEqual({ access: 'access-token', refresh: 'refresh-token' });
        });
    });
});

const createMockCompany = async (overrides = {}) => {
    const password = 'plainPassword';
    const hashedPassword = await bcrypt.hash(password, 10);
    return {
        _id: new Types.ObjectId(),
        email: 'test@company.com',
        password: hashedPassword,
        plainPassword: password,
        ban: null as any,
        ...overrides,
    };
};

const createMockRefreshToken = (userId: Types.ObjectId, expiresInMs: number = 60 * 60 * 1000) => {
    return {
        _id: new Types.ObjectId(),
        userId,
        role: Role.COMPANY,
        expiresAt: new Date(Date.now() + expiresInMs),
    };
};

const createMockTokenPayload = (overrides = {}) => {
    return {
        _id: new Types.ObjectId(),
        sub: new Types.ObjectId(),
        role: Role.COMPANY,
        exp: Date.now() + 10000,
        ...overrides,
    };
};
