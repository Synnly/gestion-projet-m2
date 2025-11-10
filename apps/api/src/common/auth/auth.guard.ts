import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard that validates JWT tokens for protected routes
 * Extracts the token from the Authorization header and verifies it
 */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Validates the JWT token from the request
     * @param context The execution context containing the HTTP request
     * @returns True if the token is valid
     * @throws {UnauthorizedException} if the token is missing, invalid, or JWT secret is not configured
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token not found');
        }

        try {
            const secret = this.configService.get<string>('JWT_SECRET');
            if (!secret) {
                throw new UnauthorizedException('JWT secret not configured');
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: secret,
            });

            request['user'] = payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }

        return true;
    }

    /**
     * Extracts the JWT token from the Authorization header
     * @param request The HTTP request object
     * @returns The extracted token or undefined if not found or invalid format
     */
    private extractTokenFromHeader(request: Request): string | undefined {
        const authorization = request.headers.authorization;
        if (!authorization) {
            return undefined;
        }

        const [type, token] = authorization.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
