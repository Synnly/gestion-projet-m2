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
import { NotFoundException } from '@nestjs/common';

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
                    ],
                }).compile(),
            ).rejects.toThrow('Refresh token lifespan is not configured');
        });
    });

    describe('login', () => {
        it('should return access and refresh tokens when company is found with valid credentials and login is called', async () => {
            const password = 'plain';
            const hashed = await bcrypt.hash(password, 10);
            const company = { _id: new Types.ObjectId(), email: 'c@test', password } as any;

            mockCompanyService.findByEmail.mockResolvedValue({ ...company, password: hashed });

            const saved = {
                _id: new Types.ObjectId(),
                userId: company._id,
                expiresAt: new Date(Date.now() + 1000 * 60 * REFRESH_LIFESPAN),
            };
            refreshTokenModel.create.mockResolvedValue(saved);
            refreshTokenModel.findById.mockResolvedValue(saved);

            mockRefreshJwtService.signAsync.mockResolvedValue('refresh-token');
            mockJwtService.signAsync.mockResolvedValue('access-token');

            const res = await service.login(company.email, password, Role.COMPANY);

            expect(res).toEqual({ access: 'access-token', refresh: 'refresh-token' });
            expect(mockCompanyService.findByEmail).toHaveBeenCalledWith(company.email);
            expect(mockRefreshJwtService.signAsync).toHaveBeenCalled();
            expect(mockJwtService.signAsync).toHaveBeenCalled();
        });

        it('should throw NotFoundException when company not found and login is called', async () => {
            mockCompanyService.findByEmail.mockResolvedValue(null);

            await expect(service.login('x@x', 'p', Role.COMPANY)).rejects.toThrow(NotFoundException);
        });

        it('should throw InvalidCredentialsException when password mismatches and login is called', async () => {
            const hashed = await bcrypt.hash('right', 10);
            mockCompanyService.findByEmail.mockResolvedValue({
                _id: new Types.ObjectId(),
                email: 'a',
                password: hashed,
            });

            await expect(service.login('a', 'wrong', Role.COMPANY)).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when invalid role is provided and login is called', async () => {
            await expect(service.login('a', 'b', 'INEXISTENT_ROLE' as Role)).rejects.toThrow(
                InvalidCredentialsException,
            );
        });
    });

    describe('generateAccessToken', () => {
        it('should throw InvalidCredentialsException when refresh token is not found and generateAccessToken is called', async () => {
            refreshTokenModel.findById.mockResolvedValue(null);
            await expect(
                (service as any).generateAccessToken(new Types.ObjectId(), 'e', Role.COMPANY, new Types.ObjectId()),
            ).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when refresh token belongs to different user and generateAccessToken is called', async () => {
            const userId = new Types.ObjectId();
            const rti = new Types.ObjectId();
            refreshTokenModel.findById.mockResolvedValue({
                _id: rti,
                userId: new Types.ObjectId(),
                expiresAt: new Date(Date.now() + 1000),
            });

            await expect((service as any).generateAccessToken(userId, 'e', Role.COMPANY, rti)).rejects.toThrow(
                InvalidCredentialsException,
            );
        });

        it('should throw InvalidCredentialsException when refresh token is expired and generateAccessToken is called resulting in deleteOne being called', async () => {
            const userId = new Types.ObjectId();
            const rti = new Types.ObjectId();
            refreshTokenModel.findById.mockResolvedValue({
                _id: rti,
                userId: userId,
                expiresAt: new Date(Date.now() - 1000),
            });

            await expect((service as any).generateAccessToken(userId, 'e', Role.COMPANY, rti)).rejects.toThrow(
                InvalidCredentialsException,
            );
            expect(refreshTokenModel.deleteOne).toHaveBeenCalledWith({ _id: rti });
        });

        it('should return signed access token when refresh token is valid and generateAccessToken is called', async () => {
            const userId = new Types.ObjectId();
            const rti = new Types.ObjectId();
            refreshTokenModel.findById.mockResolvedValue({
                _id: rti,
                userId: userId,
                expiresAt: new Date(Date.now() + 10000),
            });
            mockJwtService.signAsync.mockResolvedValue('signed');

            const token = await (service as any).generateAccessToken(userId, 'e@test', Role.COMPANY, rti);
            expect(token).toBe('signed');
            expect(mockJwtService.signAsync).toHaveBeenCalledWith(expect.objectContaining({ sub: userId }));
        });
    });

    describe('generateRefreshToken', () => {
        it('should create and sign a refresh token when generateRefreshToken is called with valid userId and role', async () => {
            const userId = new Types.ObjectId();
            const saved = {
                _id: new Types.ObjectId(),
                userId: userId,
                role: Role.COMPANY,
                expiresAt: new Date(Date.now() + 1000 * 60 * REFRESH_LIFESPAN),
            };
            refreshTokenModel.create.mockResolvedValue(saved);

            mockRefreshJwtService.signAsync.mockResolvedValue('rt');

            const res = await (service as any).generateRefreshToken(userId, Role.COMPANY);
            expect(res).toEqual({ token: 'rt', rti: saved._id });
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
            await expect(service.refreshAccessToken('x')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when refresh token is not found in database and refreshAccessToken is called', async () => {
            const payload = {
                _id: new Types.ObjectId(),
                sub: new Types.ObjectId(),
                role: Role.COMPANY,
                exp: Date.now() + 10000,
            };
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue(null);

            await expect(service.refreshAccessToken('t')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when token is expired and refreshAccessToken is called resulting in deleteOne being called', async () => {
            const tokenId = new Types.ObjectId();
            const payload = {
                _id: tokenId,
                sub: new Types.ObjectId(),
                role: Role.COMPANY,
                exp: Date.now() - 1000,
            };
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue({
                _id: tokenId,
                userId: payload.sub,
                role: Role.COMPANY,
                expiresAt: new Date(Date.now() - 1000),
            });

            await expect(service.refreshAccessToken('t')).rejects.toThrow(InvalidCredentialsException);
            expect(refreshTokenModel.deleteOne).toHaveBeenCalledWith({ _id: tokenId });
        });

        it('should throw InvalidCredentialsException when company is not found and refreshAccessToken is called', async () => {
            const payload = {
                _id: new Types.ObjectId(),
                sub: new Types.ObjectId(),
                role: Role.COMPANY,
                exp: Date.now() + 10000,
            };
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue({
                _id: payload._id,
                userId: payload.sub,
                role: Role.COMPANY,
                expiresAt: new Date(Date.now() + 10000),
            });
            mockCompanyService.findOne.mockResolvedValue(null);

            await expect(service.refreshAccessToken('t')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should throw InvalidCredentialsException when refresh token has invalid role and refreshAccessToken is called', async () => {
            const payload = {
                _id: new Types.ObjectId(),
                sub: new Types.ObjectId(),
                role: Role.STUDENT,
                exp: Date.now() + 10000,
            };
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue({
                _id: payload._id,
                userId: payload.sub,
                role: Role.STUDENT,
                expiresAt: new Date(Date.now() + 10000),
            });

            await expect(service.refreshAccessToken('t')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should return new access token when all data is valid and refreshAccessToken is called', async () => {
            const companyId = new Types.ObjectId();
            const tokenId = new Types.ObjectId();
            const payload = {
                _id: tokenId,
                sub: companyId,
                role: Role.COMPANY,
                exp: Date.now() + 10000,
            } as any;
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);
            refreshTokenModel.findOne.mockResolvedValue({
                _id: tokenId,
                userId: companyId,
                role: Role.COMPANY,
                expiresAt: new Date(Date.now() + 10000),
            });
            mockCompanyService.findOne.mockResolvedValue({ _id: companyId, email: 'c@test' });

            jest.spyOn<any, any>(service as any, 'generateAccessToken').mockResolvedValue('new-access');

            const token = await service.refreshAccessToken('t');
            expect(token).toBe('new-access');
        });
    });

    describe('logout', () => {
        it('should throw InvalidCredentialsException when verify fails and logout is called', async () => {
            mockRefreshJwtService.verify.mockReturnValue(false);
            await expect(service.logout('x')).rejects.toThrow(InvalidCredentialsException);
        });

        it('should delete refresh token when valid token is provided and logout is called', async () => {
            const payload = {
                _id: new Types.ObjectId(),
                sub: new Types.ObjectId(),
                role: Role.COMPANY,
                exp: new Date(Date.now() + 10000),
            };
            mockRefreshJwtService.verify.mockReturnValue(true);
            mockRefreshJwtService.decode.mockReturnValue(payload);

            await service.logout('t');
            expect(refreshTokenModel.deleteOne).toHaveBeenCalledWith({ _id: payload._id });
        });
    });
});
