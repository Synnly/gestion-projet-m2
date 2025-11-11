import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { InvalidConfigurationException } from '../../../src/common/exceptions/invalidConfiguration.exception';

describe('AuthGuard', () => {
    let guard: AuthGuard;
    let jwtService: JwtService;
    let configService: ConfigService;

    const mockJwtService = {
        verifyAsync: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const createMockExecutionContext = (request: Partial<Request> = {}): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => request,
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as unknown as ExecutionContext;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthGuard,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        guard = module.get<AuthGuard>(AuthGuard);
        jwtService = module.get<JwtService>(JwtService);
        configService = module.get<ConfigService>(ConfigService);

        jest.clearAllMocks();
    });

    it('should be defined when guard is instantiated', () => {
        expect(guard).toBeDefined();
    });

    const setupValidToken = (token: string = 'valid-refresh-token', decodedToken: any = { sub: 'user-id', email: 'test@example.com', role: 'COMPANY' }) => {
        mockConfigService.get.mockReturnValue('test-secret');
        mockJwtService.verifyAsync.mockResolvedValue(decodedToken);
        return { token, decodedToken };
    };

    const setupInvalidSecret = (secretValue: any) => {
        mockConfigService.get.mockReturnValue(secretValue);
    };

    const setupTokenError = (errorMessage: string) => {
        mockConfigService.get.mockReturnValue('test-secret');
        mockJwtService.verifyAsync.mockRejectedValue(new Error(errorMessage));
    };

    describe('canActivate', () => {
        it('should return true when valid refresh token is provided and canActivate is called resulting in user being set on request', async () => {
            const { token, decodedToken } = setupValidToken();
            const mockRequest = { refreshToken: token } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(configService.get).toHaveBeenCalledWith('REFRESH_TOKEN_SECRET');
            expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, { secret: 'test-secret' });
            expect(mockRequest['user']).toEqual(decodedToken);
        });

        it('should throw UnauthorizedException when refresh token is not found in request and canActivate is called', async () => {
            const mockRequest = {} as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
            await expect(guard.canActivate(context)).rejects.toThrow('Refresh token not found');
            expect(configService.get).not.toHaveBeenCalled();
            expect(jwtService.verifyAsync).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when refresh token is undefined and canActivate is called', async () => {
            const mockRequest = { refreshToken: undefined } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
            await expect(guard.canActivate(context)).rejects.toThrow('Refresh token not found');
        });

        it('should throw UnauthorizedException when refresh token is null and canActivate is called', async () => {
            const mockRequest = { refreshToken: null } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
            await expect(guard.canActivate(context)).rejects.toThrow('Refresh token not found');
        });

        it('should throw UnauthorizedException when refresh token is empty string and canActivate is called', async () => {
            const mockRequest = { refreshToken: '' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
            await expect(guard.canActivate(context)).rejects.toThrow('Refresh token not found');
        });

        it('should throw InvalidConfigurationException when REFRESH_TOKEN_SECRET is not configured and canActivate is called', async () => {
            setupInvalidSecret(undefined);
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow(InvalidConfigurationException);
            await expect(guard.canActivate(context)).rejects.toThrow('Refresh token secret not configured');
            expect(configService.get).toHaveBeenCalledWith('REFRESH_TOKEN_SECRET');
            expect(jwtService.verifyAsync).not.toHaveBeenCalled();
        });

        it('should throw InvalidConfigurationException when REFRESH_TOKEN_SECRET is null and canActivate is called', async () => {
            setupInvalidSecret(null);
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow(InvalidConfigurationException);
            await expect(guard.canActivate(context)).rejects.toThrow('Refresh token secret not configured');
        });

        it('should throw InvalidConfigurationException when REFRESH_TOKEN_SECRET is empty string and canActivate is called', async () => {
            setupInvalidSecret('');
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow(InvalidConfigurationException);
            await expect(guard.canActivate(context)).rejects.toThrow('Refresh token secret not configured');
        });

        it('should throw error when jwtService verifyAsync fails and canActivate is called', async () => {
            setupTokenError('Invalid token');
            const mockRequest = { refreshToken: 'invalid-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
            expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', { secret: 'test-secret' });
        });

        it('should throw error when token is expired and canActivate is called', async () => {
            setupTokenError('Token expired');
            const mockRequest = { refreshToken: 'expired-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow('Token expired');
        });

        it('should throw error when token signature is invalid and canActivate is called', async () => {
            setupTokenError('Invalid signature');
            const mockRequest = { refreshToken: 'tampered-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expect(guard.canActivate(context)).rejects.toThrow('Invalid signature');
        });

        it('should set user with complete payload when valid token with all fields is provided and canActivate is called', async () => {
            const decodedToken = {
                _id: 'token-id',
                sub: 'user-id',
                email: 'test@example.com',
                role: 'COMPANY',
                exp: 1234567890,
                iat: 1234567800,
            };
            setupValidToken('valid-refresh-token', decodedToken);
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await guard.canActivate(context);

            expect(mockRequest['user']).toEqual(decodedToken);
            expect(mockRequest['user']._id).toBe('token-id');
            expect(mockRequest['user'].sub).toBe('user-id');
            expect(mockRequest['user'].email).toBe('test@example.com');
            expect(mockRequest['user'].role).toBe('COMPANY');
        });

        it('should use correct secret when verifying token and canActivate is called', async () => {
            const secret = 'my-super-secret-key';
            mockConfigService.get.mockReturnValue(secret);
            mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await guard.canActivate(context);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token', { secret });
        });

        it('should return boolean true and not truthy value when valid token is provided and canActivate is called', async () => {
            setupValidToken();
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(typeof result).toBe('boolean');
        });

        it('should not have user property on request before verification when canActivate is called', async () => {
            setupValidToken();
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            expect(mockRequest['user']).toBeUndefined();

            await guard.canActivate(context);

            expect(mockRequest['user']).toBeDefined();
        });

        it('should handle token with minimal payload when valid minimal token is provided and canActivate is called', async () => {
            const decodedToken = { sub: 'user-id' };
            setupValidToken('minimal-token', decodedToken);
            const mockRequest = { refreshToken: 'minimal-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockRequest['user']).toEqual(decodedToken);
        });

        it('should call configService get exactly once when canActivate is called', async () => {
            setupValidToken();
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await guard.canActivate(context);

            expect(configService.get).toHaveBeenCalledTimes(1);
        });

        it('should call jwtService verifyAsync exactly once when canActivate is called', async () => {
            setupValidToken();
            const mockRequest = { refreshToken: 'valid-refresh-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await guard.canActivate(context);

            expect(jwtService.verifyAsync).toHaveBeenCalledTimes(1);
        });
    });
});
