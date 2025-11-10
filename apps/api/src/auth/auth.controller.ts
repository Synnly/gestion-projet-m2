import { Body, Controller, Post, Req, Res, ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { InvalidConfigurationException } from '../common/exceptions/invalidConfiguration.exception';

/**
 * Controller handling authentication-related HTTP requests.
 * Provides endpoints for login, token refresh, and logout.
 */
@Controller('/api/auth')
export class AuthController {
    /** Lifespan of the refresh token cookie in milliseconds */
    private readonly COOKIE_LIFESPAN: number;

    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        const lifespan = this.configService.get<number>('REFRESH_TOKEN_LIFESPAN_MINUTES');
        if (!lifespan) throw new InvalidConfigurationException('Refresh token lifespan is not configured');

        this.COOKIE_LIFESPAN = lifespan * 60 * 1000;
    }

    /**
     * Handles user login. Generates access and refresh tokens.
     * Sets the refresh token in an HTTP-only cookie.
     * @param dto Login DTO containing email, password, and role
     * @param res HTTP response object
     * @returns The access token
     * @throws {InvalidCredentialsException} if credentials are invalid
     * @throws {NotFoundException} if user with given email does not exist
     */
    @Post('login')
    async login(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: LoginDto,
        @Res({ passthrough: true }) res: express.Request,
    ): Promise<string> {
        const { access, refresh } = await this.authService.login(dto.email, dto.password, dto.role);
        res.cookies('refreshToken', refresh, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/api/auth/refresh',
            maxAge: this.COOKIE_LIFESPAN,
        });
        return access;
    }

    /**
     * Handles access token refresh using the provided refresh token.
     * @param req The HTTP request object containing cookies
     * @returns The new access token
     * @throws {InvalidCredentialsException} if the refresh token is invalid or expired
     */
    @Post('refresh')
    async refresh(@Req() req: express.Request): Promise<string> {
        const refreshTokenString = req.cookies.get('refreshToken');
        return await this.authService.refreshAccessToken(refreshTokenString);
    }

    /**
     * Handles user logout by invalidating the provided refresh token.
     * @param req The HTTP request object containing cookies
     * @throws {InvalidCredentialsException} if the refresh token is invalid
     */
    @Post('logout')
    async logout(@Req() req: express.Request) {
        const refreshTokenString = req.cookies.get('refreshToken');
        await this.authService.logout(refreshTokenString);
    }
}
