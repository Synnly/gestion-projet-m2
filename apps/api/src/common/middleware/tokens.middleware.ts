import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { InvalidConfigurationException } from '../exceptions/invalidConfiguration.exception';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload, RefreshTokenPayload } from '../../auth/refreshToken.schema';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class TokensMiddleware implements NestMiddleware {
    private readonly ACCESS_TOKEN_SECRET: string;
    private readonly REFRESH_TOKEN_SECRET: string;

    constructor(
        private readonly jwtService: JwtService,
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        let secret: string | undefined;

        // Load and validate refresh token secret
        secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
        if (!secret) throw new InvalidConfigurationException('Refresh token secret is not configured');
        this.REFRESH_TOKEN_SECRET = secret;

        // Load and validate access token secret
        secret = this.configService.get<string>('ACCESS_TOKEN_SECRET');
        if (!secret) throw new InvalidConfigurationException('Access token secret is not configured');
        this.ACCESS_TOKEN_SECRET = secret;
    }

    /**
     * Middleware function to handle token extraction and verification
     * @param req HTTP request object
     * @param res HTTP response object
     * @param next Next middleware function
     */
    async use(req: Request, res: Response, next: NextFunction) {
        try {
            const token = this.extractTokenFromHeader(req);

            // Access token found
            if (token) {
                try {
                    const accessPayload = this.jwtService.verify<AccessTokenPayload>(token, {
                        secret: this.ACCESS_TOKEN_SECRET,
                    });
                    this.setUser(req, accessPayload);
                    return next();
                } catch {
                    // Access token invalid, try refresh token now
                }
            }

            // Access token missing or invalid, try refresh token
            const refreshToken = req.cookies?.refreshToken;
            if (refreshToken) {
                let refreshPayload: RefreshTokenPayload | null;
                try {
                    refreshPayload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
                        secret: this.REFRESH_TOKEN_SECRET,
                    });
                } catch {
                    // Refresh token invalid, nothing more to do
                    return next();
                }

                // Verify expiration of refresh token
                if (refreshPayload.expiresAt! < Date.now()) return next();

                // Refresh the access token
                try {
                    const newAccess = await this.authService.refreshAccessToken(refreshToken);
                    if (newAccess) {
                        res.setHeader('authorization', `Bearer ${newAccess}`);
                        try {
                            const accessPayload = this.jwtService.verify<AccessTokenPayload>(newAccess, {
                                secret: this.ACCESS_TOKEN_SECRET,
                            });
                            this.setUser(req, accessPayload);
                        } catch {
                            // Verify failed, continue without user
                        }
                    }
                } catch {
                    // Refresh failed, continue without user
                }
            }
        } catch {
        } finally {
            // Security : always continue the request even on error
            next();
        }
    }

    /**
     * Extracts the access token from the Authorization header
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

    /**
     * Sets the user information on the request object
     * @param req The HTTP request object
     * @param payload The access token payload
     */
    private setUser(req: Request, payload: AccessTokenPayload): void {
        if (!req.user) req.user = {};
        req.user.sub = payload.sub.toString();
        req.user.email = payload.email;
        req.user.role = payload.role;
    }
}
