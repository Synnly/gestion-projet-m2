import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import { Role } from '../../../src/common/roles/roles.enum';
import { InvalidCredentialsException } from '../../../src/common/exceptions/invalidCredentials.exception';
import { NotFoundException } from '@nestjs/common';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;
    const REFRESH_TOKEN_LIFESPAN_MINUTES = 60;

    const mockAuthService = {
        login: jest.fn(),
        refreshAccessToken: jest.fn(),
        logout: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'REFRESH_TOKEN_LIFESPAN_MINUTES') return REFRESH_TOKEN_LIFESPAN_MINUTES;
            return undefined;
        }),
    };

    const createMockResponse = () => {
        return {
            cookie: jest.fn(),
        };
    };

    const createMockRequest = (cookies: Record<string, string> = {}) => {
        return {
            cookies,
        };
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    it('should be defined when controller is instantiated', () => {
        expect(controller).toBeDefined();
    });

    describe('constructor', () => {
        it('should throw InvalidConfigurationException when REFRESH_TOKEN_LIFESPAN_MINUTES is not configured and controller is instantiated', async () => {
            const invalidConfigService = {
                get: jest.fn().mockReturnValue(undefined),
            };

            await expect(
                Test.createTestingModule({
                    controllers: [AuthController],
                    providers: [
                        {
                            provide: AuthService,
                            useValue: mockAuthService,
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
        const VALID_LOGIN_DTO: LoginDto = {
            email: 'test@example.com',
            password: 'password123',
            role: Role.COMPANY,
        };

        const MOCK_TOKENS = {
            access: 'access-token-123',
            refresh: 'refresh-token-456',
        };

        const expectCookieSettings = (mockRes: any, refreshToken: string) => {
            const expectedOptions = {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/api/auth/refresh',
                maxAge: REFRESH_TOKEN_LIFESPAN_MINUTES * 60 * 1000,
            };
            expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', refreshToken, expectedOptions);
        };

        it('should return access token when valid credentials are provided and login is called resulting in cookie being set', async () => {
            mockAuthService.login.mockResolvedValue(MOCK_TOKENS);
            const mockRes = createMockResponse();

            const result = await controller.login(VALID_LOGIN_DTO, mockRes as any);

            expect(result).toBe('access-token-123');
            expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', Role.COMPANY);
            expect(authService.login).toHaveBeenCalledTimes(1);
            expectCookieSettings(mockRes, 'refresh-token-456');
            expect(mockRes.cookie).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException when company is not found and login is called', async () => {
            const loginDto: LoginDto = { ...VALID_LOGIN_DTO, email: 'notfound@example.com' };
            mockAuthService.login.mockRejectedValue(
                new NotFoundException('Company with email notfound@example.com not found'),
            );
            const mockRes = createMockResponse();

            await expect(controller.login(loginDto, mockRes as any)).rejects.toThrow(NotFoundException);
            expect(authService.login).toHaveBeenCalledWith('notfound@example.com', 'password123', Role.COMPANY);
            expect(mockRes.cookie).not.toHaveBeenCalled();
        });

        it('should throw InvalidCredentialsException when invalid password is provided and login is called', async () => {
            const loginDto: LoginDto = { ...VALID_LOGIN_DTO, password: 'wrongpassword' };
            mockAuthService.login.mockRejectedValue(new InvalidCredentialsException());
            const mockRes = createMockResponse();

            await expect(controller.login(loginDto, mockRes as any)).rejects.toThrow(InvalidCredentialsException);
            expect(authService.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword', Role.COMPANY);
            expect(mockRes.cookie).not.toHaveBeenCalled();
        });

        it('should throw InvalidCredentialsException when invalid role is provided and login is called', async () => {
            const loginDto: LoginDto = { ...VALID_LOGIN_DTO, role: "INEXISTENT_ROLE" as Role };
            mockAuthService.login.mockRejectedValue(new InvalidCredentialsException('Invalid refresh token'));
            const mockRes = createMockResponse();

            await expect(controller.login(loginDto, mockRes as any)).rejects.toThrow(InvalidCredentialsException);
            expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123', "INEXISTENT_ROLE" as Role);
        });

        it('should set cookie with correct maxAge when login is called', async () => {
            mockAuthService.login.mockResolvedValue(MOCK_TOKENS);
            const mockRes = createMockResponse();

            await controller.login(VALID_LOGIN_DTO, mockRes as any);

            const expectedMaxAge = REFRESH_TOKEN_LIFESPAN_MINUTES * 60 * 1000;
            expect(mockRes.cookie).toHaveBeenCalledWith(
                'refreshToken',
                'refresh-token-456',
                expect.objectContaining({ maxAge: expectedMaxAge }),
            );
        });

        it('should set cookie with httpOnly true when login is called', async () => {
            mockAuthService.login.mockResolvedValue(MOCK_TOKENS);
            const mockRes = createMockResponse();

            await controller.login(VALID_LOGIN_DTO, mockRes as any);

            expect(mockRes.cookie).toHaveBeenCalledWith(
                'refreshToken',
                'refresh-token-456',
                expect.objectContaining({ httpOnly: true }),
            );
        });

        it('should set cookie with secure true when login is called', async () => {
            mockAuthService.login.mockResolvedValue(MOCK_TOKENS);
            const mockRes = createMockResponse();

            await controller.login(VALID_LOGIN_DTO, mockRes as any);

            expect(mockRes.cookie).toHaveBeenCalledWith(
                'refreshToken',
                'refresh-token-456',
                expect.objectContaining({ secure: true }),
            );
        });

        it('should set cookie with sameSite lax when login is called', async () => {
            mockAuthService.login.mockResolvedValue(MOCK_TOKENS);
            const mockRes = createMockResponse();

            await controller.login(VALID_LOGIN_DTO, mockRes as any);

            expect(mockRes.cookie).toHaveBeenCalledWith(
                'refreshToken',
                'refresh-token-456',
                expect.objectContaining({ sameSite: 'lax' }),
            );
        });

        it('should set cookie with correct path when login is called', async () => {
            mockAuthService.login.mockResolvedValue(MOCK_TOKENS);
            const mockRes = createMockResponse();

            await controller.login(VALID_LOGIN_DTO, mockRes as any);

            expect(mockRes.cookie).toHaveBeenCalledWith(
                'refreshToken',
                'refresh-token-456',
                expect.objectContaining({ path: '/api/auth/refresh' }),
            );
        });
    });

    describe('refresh', () => {
        it('should return new access token when valid refresh token is in cookies and refresh is called', async () => {
            const mockReq = createMockRequest({ refreshToken: 'valid-refresh-token' });
            mockAuthService.refreshAccessToken.mockResolvedValue('new-access-token');

            const result = await controller.refresh(mockReq as any);

            expect(result).toBe('new-access-token');
            expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
            expect(authService.refreshAccessToken).toHaveBeenCalledTimes(1);
        });

        it('should throw InvalidCredentialsException when refresh token is invalid and refresh is called', async () => {
            const mockReq = createMockRequest({ refreshToken: 'invalid-refresh-token' });
            mockAuthService.refreshAccessToken.mockRejectedValue(
                new InvalidCredentialsException('Invalid refresh token'),
            );

            await expect(controller.refresh(mockReq as any)).rejects.toThrow(InvalidCredentialsException);
            expect(authService.refreshAccessToken).toHaveBeenCalledWith('invalid-refresh-token');
        });

        it('should throw InvalidCredentialsException when refresh token is expired and refresh is called', async () => {
            const mockReq = createMockRequest({ refreshToken: 'expired-refresh-token' });
            mockAuthService.refreshAccessToken.mockRejectedValue(
                new InvalidCredentialsException('Refresh token has expired'),
            );

            await expect(controller.refresh(mockReq as any)).rejects.toThrow(InvalidCredentialsException);
            expect(authService.refreshAccessToken).toHaveBeenCalledWith('expired-refresh-token');
        });

        it('should handle undefined refresh token when no cookie is present and refresh is called', async () => {
            const mockReq = createMockRequest({});
            mockAuthService.refreshAccessToken.mockRejectedValue(
                new InvalidCredentialsException('Invalid refresh token'),
            );

            await expect(controller.refresh(mockReq as any)).rejects.toThrow(InvalidCredentialsException);
            expect(authService.refreshAccessToken).toHaveBeenCalledWith(undefined);
        });
    });

    describe('logout', () => {
        it('should call authService logout when valid refresh token is in cookies and logout is called', async () => {
            const mockReq = createMockRequest({ refreshToken: 'valid-refresh-token' });
            mockAuthService.logout.mockResolvedValue(undefined);

            await controller.logout(mockReq as any);

            expect(authService.logout).toHaveBeenCalledWith('valid-refresh-token');
            expect(authService.logout).toHaveBeenCalledTimes(1);
        });

        it('should throw InvalidCredentialsException when refresh token is invalid and logout is called', async () => {
            const mockReq = createMockRequest({ refreshToken: 'invalid-refresh-token' });
            mockAuthService.logout.mockRejectedValue(new InvalidCredentialsException('Invalid refresh token'));

            await expect(controller.logout(mockReq as any)).rejects.toThrow(InvalidCredentialsException);
            expect(authService.logout).toHaveBeenCalledWith('invalid-refresh-token');
        });

        it('should handle undefined refresh token when no cookie is present and logout is called', async () => {
            const mockReq = createMockRequest({});
            mockAuthService.logout.mockRejectedValue(new InvalidCredentialsException('Invalid refresh token'));

            await expect(controller.logout(mockReq as any)).rejects.toThrow(InvalidCredentialsException);
            expect(authService.logout).toHaveBeenCalledWith(undefined);
        });

        it('should return void when logout is successful', async () => {
            const mockReq = createMockRequest({ refreshToken: 'valid-refresh-token' });
            mockAuthService.logout.mockResolvedValue(undefined);

            const result = await controller.logout(mockReq as any);

            expect(result).toBeUndefined();
        });
    });
});
