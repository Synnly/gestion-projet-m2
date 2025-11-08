import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';

/**
 * Global authentication module that provides JWT functionality
 * Configures JWT with secret and expiration from environment variables
 * Exports AuthGuard and JwtModule for use throughout the application
 */
@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '2h';
                return {
                    secret: secret || 'default-secret-change-in-production',
                    signOptions: {
                        expiresIn: expiresIn as any,
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [AuthGuard],
    exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
