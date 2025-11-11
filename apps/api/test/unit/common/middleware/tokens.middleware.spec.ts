import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { TokensMiddleware } from '../../../../src/common/middleware/tokens.middleware';
import { AuthService } from '../../../../src/auth/auth.service';
import { InvalidConfigurationException } from '../../../../src/common/exceptions/invalidConfiguration.exception';
import { Role } from '../../../../src/common/roles/roles.enum';

describe('TokensMiddleware', () => {
    let middleware: TokensMiddleware;
    let jwtService: JwtService;
    let authService: AuthService;

    const mockJwtService = { verify: jest.fn() };
    const mockAuthService = { refreshAccessToken: jest.fn() };
    const mockConfigService = { get: jest.fn() };
    const mockNextFunction: NextFunction = jest.fn();

    const createMockRequest = (
        options: {
            authorization?: string;
            cookies?: { refreshToken?: string };
        } = {},
    ): Partial<Request> =>
        ({
            headers: { authorization: options.authorization },
            cookies: options.cookies || {},
            user: undefined,
        }) as Partial<Request>;

    const createMockResponse = (): Partial<Response> => ({ setHeader: jest.fn() });

    const createValidPayload = (overrides = {}) => ({
        sub: 'user-id-123',
        email: 'test@example.com',
        role: Role.COMPANY,
        ...overrides,
    });

    const createRefreshPayload = (expiresIn = Date.now() + 10000) => ({
        ...createValidPayload(),
        expiresIn: new Date(expiresIn),
    });

    const createTestModule = async (configOverrides?: Partial<ConfigService>) => {
        const configService = configOverrides || mockConfigService;
        return Test.createTestingModule({
            providers: [
                TokensMiddleware,
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: configService },
                { provide: AuthService, useValue: mockAuthService },
            ],
        }).compile();
    };

    beforeEach(async () => {
        mockConfigService.get.mockImplementation((key: string) => {
            const secrets = {
                REFRESH_TOKEN_SECRET: 'refresh-secret',
                ACCESS_TOKEN_SECRET: 'access-secret',
            };
            return secrets[key];
        });

        const module = await createTestModule();
        middleware = module.get<TokensMiddleware>(TokensMiddleware);
        jwtService = module.get<JwtService>(JwtService);
        authService = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });

    describe('constructor', () => {
        const testMissingSecret = async (secretKey: string) => {
            const invalidConfig = {
                get: jest.fn((key: string) =>
                    key === secretKey ? undefined : key === 'REFRESH_TOKEN_SECRET' ? 'refresh-secret' : 'access-secret',
                ),
            };

            await expect(createTestModule(invalidConfig)).rejects.toThrow(InvalidConfigurationException);
        };

        it('should throw when REFRESH_TOKEN_SECRET is missing', () => testMissingSecret('REFRESH_TOKEN_SECRET'));

        it('should throw when ACCESS_TOKEN_SECRET is missing', () => testMissingSecret('ACCESS_TOKEN_SECRET'));

        it('should initialize with both secrets', async () => {
            const validConfig = {
                get: jest.fn((key: string) => (key === 'REFRESH_TOKEN_SECRET' ? 'refresh-secret' : 'access-secret')),
            };

            const module = await createTestModule(validConfig);
            const testMiddleware = module.get<TokensMiddleware>(TokensMiddleware);
            const testConfigService = module.get<ConfigService>(ConfigService);

            expect(testConfigService.get).toHaveBeenCalledWith('REFRESH_TOKEN_SECRET');
            expect(testConfigService.get).toHaveBeenCalledWith('ACCESS_TOKEN_SECRET');
            expect(testMiddleware).toBeDefined();
        });
    });

    describe('use', () => {
        const executeMiddleware = async (request: Partial<Request>, response: Partial<Response>) => {
            await middleware.use(request as Request, response as Response, mockNextFunction);
        };

        describe('valid access token', () => {
            it('should set req.user', async () => {
                const mockRequest = createMockRequest({ authorization: 'Bearer valid-token' });
                const mockResponse = createMockResponse();

                mockJwtService.verify.mockReturnValue(createValidPayload());

                await executeMiddleware(mockRequest, mockResponse);

                expect(jwtService.verify).toHaveBeenCalledWith('valid-token', { secret: 'access-secret' });
                expect(mockRequest.user).toEqual(createValidPayload());
                expect(mockNextFunction).toHaveBeenCalled();
                expect(authService.refreshAccessToken).not.toHaveBeenCalled();
            });
        });

        describe('invalid access token', () => {
            it('should leave req.user undefined without refresh token', async () => {
                const mockRequest = createMockRequest({ authorization: 'Bearer invalid' });
                mockJwtService.verify.mockImplementation(() => {
                    throw new Error('Invalid');
                });

                await executeMiddleware(mockRequest, createMockResponse());

                expect(mockRequest.user).toBeUndefined();
                expect(mockNextFunction).toHaveBeenCalled();
            });

            it('should refresh with valid refresh token', async () => {
                const mockRequest = createMockRequest({
                    authorization: 'Bearer invalid',
                    cookies: { refreshToken: 'valid-refresh' },
                });
                const mockResponse = createMockResponse();

                let callCount = 0;
                mockJwtService.verify.mockImplementation((token: string) => {
                    callCount++;
                    if (callCount === 1) throw new Error('Invalid');
                    if (token === 'valid-refresh') return createRefreshPayload();
                    if (token === 'new-token') return createValidPayload();
                });
                mockAuthService.refreshAccessToken.mockResolvedValue('new-token');

                await executeMiddleware(mockRequest, mockResponse);

                expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh');
                expect(mockResponse.setHeader).toHaveBeenCalledWith('authorization', 'Bearer new-token');
                expect(mockRequest.user).toEqual(createValidPayload());
            });
        });

        describe('no access token', () => {
            it('should leave req.user undefined without refresh token', async () => {
                const mockRequest = createMockRequest();

                await executeMiddleware(mockRequest, createMockResponse());

                expect(mockRequest.user).toBeUndefined();
                expect(mockNextFunction).toHaveBeenCalled();
            });

            it('should refresh with valid refresh token in cookies', async () => {
                const mockRequest = createMockRequest({ cookies: { refreshToken: 'valid-refresh' } });
                const mockResponse = createMockResponse();

                mockJwtService.verify.mockImplementation((token: string) =>
                    token === 'valid-refresh' ? createRefreshPayload() : createValidPayload(),
                );
                mockAuthService.refreshAccessToken.mockResolvedValue('new-token');

                await executeMiddleware(mockRequest, mockResponse);

                expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh');
                expect(mockResponse.setHeader).toHaveBeenCalledWith('authorization', 'Bearer new-token');
                expect(mockRequest.user).toEqual(createValidPayload());
            });

            it('should ignore malformed Authorization header', async () => {
                const mockRequest = createMockRequest({ authorization: 'Basic token' });

                await executeMiddleware(mockRequest, createMockResponse());

                expect(mockRequest.user).toBeUndefined();
            });
        });

        describe('refresh token scenarios', () => {
            it('should handle invalid refresh token', async () => {
                const mockRequest = createMockRequest({ cookies: { refreshToken: 'invalid' } });
                mockJwtService.verify.mockImplementation(() => {
                    throw new Error('Invalid');
                });

                await executeMiddleware(mockRequest, createMockResponse());

                expect(authService.refreshAccessToken).not.toHaveBeenCalled();
                expect(mockRequest.user).toBeUndefined();
            });

            it('should handle expired refresh token', async () => {
                const mockRequest = createMockRequest({ cookies: { refreshToken: 'expired' } });
                mockJwtService.verify.mockReturnValue(createRefreshPayload(Date.now() - 10000));

                await executeMiddleware(mockRequest, createMockResponse());

                expect(authService.refreshAccessToken).not.toHaveBeenCalled();
                expect(mockRequest.user).toBeUndefined();
            });

            it('should handle refresh service error', async () => {
                const mockRequest = createMockRequest({ cookies: { refreshToken: 'valid' } });
                mockJwtService.verify.mockReturnValue(createRefreshPayload());
                mockAuthService.refreshAccessToken.mockRejectedValue(new Error('Refresh failed'));

                await executeMiddleware(mockRequest, createMockResponse());

                expect(mockRequest.user).toBeUndefined();
            });

            it('should handle null from refreshAccessToken', async () => {
                const mockRequest = createMockRequest({ cookies: { refreshToken: 'valid' } });
                const mockResponse = createMockResponse();
                mockJwtService.verify.mockReturnValue(createRefreshPayload());
                mockAuthService.refreshAccessToken.mockResolvedValue(null);

                await executeMiddleware(mockRequest, mockResponse);

                expect(mockResponse.setHeader).not.toHaveBeenCalled();
                expect(mockRequest.user).toBeUndefined();
            });

            it('should handle invalid new access token', async () => {
                const mockRequest = createMockRequest({ cookies: { refreshToken: 'valid' } });
                const mockResponse = createMockResponse();

                let callCount = 0;
                mockJwtService.verify.mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) return createRefreshPayload();
                    throw new Error('Invalid');
                });
                mockAuthService.refreshAccessToken.mockResolvedValue('new-token');

                await executeMiddleware(mockRequest, mockResponse);

                expect(mockResponse.setHeader).toHaveBeenCalledWith('authorization', 'Bearer new-token');
                expect(mockRequest.user).toBeUndefined();
            });
        });

        describe('user object management', () => {
            it('should create req.user with valid payload', async () => {
                const mockRequest = createMockRequest({ authorization: 'Bearer token' });
                mockJwtService.verify.mockReturnValue(createValidPayload());

                await executeMiddleware(mockRequest, createMockResponse());

                expect(mockRequest.user).toEqual(createValidPayload());
            });

            it('should set correct user properties', async () => {
                const customPayload = createValidPayload({ sub: 'user-456', email: 'other@example.com' });
                const mockRequest = createMockRequest({ authorization: 'Bearer token' });
                mockJwtService.verify.mockReturnValue(customPayload);

                await executeMiddleware(mockRequest, createMockResponse());

                expect(mockRequest.user?.sub).toBe('user-456');
                expect(mockRequest.user?.email).toBe('other@example.com');
                expect(mockRequest.user?.role).toBe(Role.COMPANY);
            });

            it('should preserve existing req.user properties', async () => {
                const mockRequest = createMockRequest({ authorization: 'Bearer token' });
                mockRequest.user = { existingProperty: 'value' };
                mockJwtService.verify.mockReturnValue(createValidPayload({ sub: 'new-id' }));

                await executeMiddleware(mockRequest, createMockResponse());

                expect(mockRequest.user?.sub).toBe('new-id');
                expect((mockRequest.user as any).existingProperty).toBe('value');
            });
        });

        describe('error handling', () => {
            it('should call next on unexpected errors', async () => {
                const mockRequest = createMockRequest({ authorization: 'Bearer token' });
                mockJwtService.verify.mockImplementation(() => {
                    throw new Error('Unexpected');
                });

                await executeMiddleware(mockRequest, createMockResponse());

                expect(mockNextFunction).toHaveBeenCalled();
            });

            it('should call next exactly once', async () => {
                await executeMiddleware({} as Request, createMockResponse());

                expect(mockNextFunction).toHaveBeenCalledTimes(1);
            });
        });
    });
});
