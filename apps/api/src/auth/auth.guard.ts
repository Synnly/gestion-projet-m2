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
     * Validates the access token from the request.
     * @param context The execution context containing the HTTP request
     * @returns True if the token is valid
     * @throws {UnauthorizedException} if the token is missing or invalid
     * @throws {InvalidConfigurationException} if the access token secret is not configured
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const accessToken = request['accessToken'];

        if (!accessToken) throw new UnauthorizedException('Access token not found');

        const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET');
        if (!secret) throw new InvalidConfigurationException('Access token secret not configured');

        request['user'] = await this.jwtService.verifyAsync(accessToken, { secret }).catch(() => {
            throw new UnauthorizedException('Invalid access token');
        });

        return true;
    }
}
