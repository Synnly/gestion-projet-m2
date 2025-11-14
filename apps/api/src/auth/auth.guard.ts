import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InvalidConfigurationException } from '../common/exceptions/invalidConfiguration.exception';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Validates the refresh token from the request.
     * @param context The execution context containing the HTTP request
     * @returns True if the token is valid
     * @throws {UnauthorizedException} if the token is missing or invalid
     * @throws {InvalidConfigurationException} if the refresh token secret is not configured
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const refreshToken = request['refreshToken'];

        if (!refreshToken) throw new UnauthorizedException('Refresh token not found');

        const secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
        if (!secret) throw new InvalidConfigurationException('Refresh token secret not configured');

        request['user'] = await this.jwtService.verifyAsync(refreshToken, { secret });

        return true;
    }
}
