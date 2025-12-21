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

    const setupValidToken = (
        token: string = 'valid-access-token',
        decodedToken: any = { sub: 'user-id', email: 'test@example.com', role: 'COMPANY' },
    ) => {
        mockConfigService.get.mockReturnValue('test-access-secret');
        mockJwtService.verifyAsync.mockResolvedValue(decodedToken);
        return { token, decodedToken };
    };

    const setupInvalidSecret = (secretValue: any) => {
        mockConfigService.get.mockReturnValue(secretValue);
    };

    const setupTokenError = (errorMessage: string = 'Invalid token') => {
        mockConfigService.get.mockReturnValue('test-access-secret');
        mockJwtService.verifyAsync.mockRejectedValue(new Error(errorMessage));
    };

    const expectUnauthorizedRejection = async (context: ExecutionContext, message: string) => {
        await guard.canActivate(context).then(
            () => {
                throw new Error('Expected UnauthorizedException to be thrown');
            },
            (error) => {
                expect(error).toBeInstanceOf(UnauthorizedException);
                expect(error.message).toBe(message);
            },
        );
    };

    const expectInvalidConfigRejection = async (context: ExecutionContext, message: string) => {
        await guard.canActivate(context).then(
            () => {
                throw new Error('Expected InvalidConfigurationException to be thrown');
            },
            (error) => {
                expect(error).toBeInstanceOf(InvalidConfigurationException);
                expect(error.message).toBe(message);
            },
        );
    };

    describe('canActivate', () => {
        it('should return true when valid access token is provided and canActivate is called resulting in user being set on request', async () => {
            const { token, decodedToken } = setupValidToken();
            const mockRequest = { accessToken: token } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(configService.get).toHaveBeenCalledWith('ACCESS_TOKEN_SECRET');
            expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, { secret: 'test-access-secret' });
            expect(mockRequest['user']).toEqual(decodedToken);
        });

        it('should throw UnauthorizedException when access token is not found in request and canActivate is called', async () => {
            const mockRequest = {} as Request;
            const context = createMockExecutionContext(mockRequest);

            await expectUnauthorizedRejection(context, 'Access token not found');
            expect(configService.get).not.toHaveBeenCalled();
            expect(jwtService.verifyAsync).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when access token is undefined and canActivate is called', async () => {
            const mockRequest = { accessToken: undefined } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expectUnauthorizedRejection(context, 'Access token not found');
        });

        it('should throw UnauthorizedException when access token is null and canActivate is called', async () => {
            const mockRequest = { accessToken: null } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expectUnauthorizedRejection(context, 'Access token not found');
        });

        it('should throw UnauthorizedException when access token is empty string and canActivate is called', async () => {
            const mockRequest = { accessToken: '' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expectUnauthorizedRejection(context, 'Access token not found');
        });

        it('should throw InvalidConfigurationException when ACCESS_TOKEN_SECRET is not configured and canActivate is called', async () => {
            setupInvalidSecret(undefined);
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expectInvalidConfigRejection(context, 'Access token secret not configured');
            expect(configService.get).toHaveBeenCalledWith('ACCESS_TOKEN_SECRET');
            expect(jwtService.verifyAsync).not.toHaveBeenCalled();
        });

        it('should throw InvalidConfigurationException when ACCESS_TOKEN_SECRET is null and canActivate is called', async () => {
            setupInvalidSecret(null);
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expectInvalidConfigRejection(context, 'Access token secret not configured');
        });

        it('should throw InvalidConfigurationException when ACCESS_TOKEN_SECRET is empty string and canActivate is called', async () => {
            setupInvalidSecret('');
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expectInvalidConfigRejection(context, 'Access token secret not configured');
        });

        it('should throw UnauthorizedException when jwtService verifyAsync fails and canActivate is called', async () => {
            setupTokenError('Invalid token');
            const mockRequest = { accessToken: 'invalid-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await expectUnauthorizedRejection(context, 'Invalid access token');
            expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', { secret: 'test-access-secret' });
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
            setupValidToken('valid-access-token', decodedToken);
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
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
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await guard.canActivate(context);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-access-token', { secret });
        });

        it('should return boolean true and not truthy value when valid token is provided and canActivate is called', async () => {
            setupValidToken();
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(typeof result).toBe('boolean');
        });

        it('should not have user property on request before verification when canActivate is called', async () => {
            setupValidToken();
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            expect(mockRequest['user']).toBeUndefined();

            await guard.canActivate(context);

            expect(mockRequest['user']).toBeDefined();
        });

        it('should handle token with minimal payload when valid minimal token is provided and canActivate is called', async () => {
            const decodedToken = { sub: 'user-id' };
            setupValidToken('minimal-token', decodedToken);
            const mockRequest = { accessToken: 'minimal-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockRequest['user']).toEqual(decodedToken);
        });

        it('should call configService get exactly once when canActivate is called', async () => {
            setupValidToken();
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await guard.canActivate(context);

            expect(configService.get).toHaveBeenCalledTimes(1);
        });

        it('should call jwtService verifyAsync exactly once when canActivate is called', async () => {
            setupValidToken();
            const mockRequest = { accessToken: 'valid-access-token' } as unknown as Request;
            const context = createMockExecutionContext(mockRequest);

            await guard.canActivate(context);

            expect(jwtService.verifyAsync).toHaveBeenCalledTimes(1);
        });
    });
});
