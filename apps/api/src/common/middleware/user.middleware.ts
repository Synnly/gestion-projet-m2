import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * Middleware that optionally extracts user information from JWT tokens
 * Does not throw errors if token is missing or invalid, allowing requests to proceed
 */
@Injectable()
export class UserMiddleware implements NestMiddleware {
    constructor(private readonly jwtService: JwtService) {}

    /**
     * Attempts to extract and verify JWT token from the Authorization header
     * If successful, adds the decoded payload to the request object
     * @param req The HTTP request object
     * @param res The HTTP response object
     * @param next The next middleware function
     */
    use(req: Request, res: Response, next: NextFunction) {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const payload = this.jwtService.verify(token);
                req['user'] = payload;
            } catch (error) {
                // Token validation failed, continuing without user
                // Uncomment the next line to log errors for debugging:
                // console.debug('JWT verification error:', error);
            }
        }
        next();
    }
}
