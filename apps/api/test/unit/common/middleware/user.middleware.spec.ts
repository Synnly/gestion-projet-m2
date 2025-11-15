import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UserMiddleware } from '../../../../src/common/middleware/user.middleware';
import { Request, Response, NextFunction } from 'express';

describe('UserMiddleware', () => {
    let middleware: UserMiddleware;
    let jwtService: JwtService;

    const mockJwtService = {
        verify: jest.fn(),
    };

    const mockRequest = () => {
        const req: Partial<Request> = {
            headers: {},
        };
        return req as Request;
    };

    const mockResponse = () => {
        const res: Partial<Response> = {};
        return res as Response;
    };

    const mockNext: NextFunction = jest.fn();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserMiddleware,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        middleware = module.get<UserMiddleware>(UserMiddleware);
        jwtService = module.get<JwtService>(JwtService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });

    describe('use', () => {
        it('should set req.user when valid token is provided in Authorization header', () => {
            const req = mockRequest();
            const res = mockResponse();
            const payload = { sub: 'user-id', email: 'user@example.com', role: 'COMPANY' };

            req.headers.authorization = 'Bearer valid-token';
            mockJwtService.verify.mockReturnValue(payload);

            middleware.use(req, res, mockNext);

            expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
            expect(req['user']).toEqual(payload);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should call next without setting req.user when no Authorization header is present', () => {
            const req = mockRequest();
            const res = mockResponse();

            middleware.use(req, res, mockNext);

            expect(jwtService.verify).not.toHaveBeenCalled();
            expect(req['user']).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should call next without setting req.user when Authorization header has no token', () => {
            const req = mockRequest();
            const res = mockResponse();

            req.headers.authorization = 'Bearer';

            middleware.use(req, res, mockNext);

            expect(req['user']).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should call next without setting req.user when token verification fails', () => {
            const req = mockRequest();
            const res = mockResponse();

            req.headers.authorization = 'Bearer invalid-token';
            mockJwtService.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            middleware.use(req, res, mockNext);

            expect(jwtService.verify).toHaveBeenCalledWith('invalid-token');
            expect(req['user']).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should call next without setting req.user when token is expired', () => {
            const req = mockRequest();
            const res = mockResponse();

            req.headers.authorization = 'Bearer expired-token';
            mockJwtService.verify.mockImplementation(() => {
                throw new Error('Token expired');
            });

            middleware.use(req, res, mockNext);

            expect(jwtService.verify).toHaveBeenCalledWith('expired-token');
            expect(req['user']).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle malformed Authorization header gracefully', () => {
            const req = mockRequest();
            const res = mockResponse();

            req.headers.authorization = 'InvalidFormat';

            middleware.use(req, res, mockNext);

            expect(req['user']).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle Authorization header without token part', () => {
            const req = mockRequest();
            const res = mockResponse();

            req.headers.authorization = 'Bearer ';

            middleware.use(req, res, mockNext);

            expect(req['user']).toBeUndefined();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should always call next exactly once', () => {
            const req = mockRequest();
            const res = mockResponse();

            req.headers.authorization = 'Bearer valid-token';
            mockJwtService.verify.mockReturnValue({ sub: 'user-id' });

            middleware.use(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });
});
