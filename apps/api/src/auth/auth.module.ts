import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RefreshToken, RefreshTokenSchema } from './refreshToken.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard';
import { StringValue } from 'ms';
import { CompanyModule } from '../company/company.module';
import { UsersModule } from '../user/user.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { MailerService } from 'src/mailer/mailer.service';
import { MailerProviderType } from 'src/mailer/constants';

/**
 * Global module for authentication.
 * Provides JWT services, authentication guards, and related functionality.
 */
@Global()
@Module({
    imports: [
        ConfigModule,
        CompanyModule,
        UsersModule,
        MailerModule.register(MailerProviderType.gmail),
        MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const secret = config.get<string>('ACCESS_TOKEN_SECRET') || 'change-me-access-secret';
                const expires = (config.get<string>('ACCESS_TOKEN_LIFESPAN_MINUTES') || '5') + 'm';
                return {
                    secret,
                    signOptions: { expiresIn: expires as StringValue },
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [
        {
            provide: 'REFRESH_JWT_SERVICE',
            useFactory: (config: ConfigService) => {
                const secret = config.get<string>('REFRESH_TOKEN_SECRET') || 'change-me-refresh-secret';
                const expires = (config.get<string>('REFRESH_TOKEN_LIFESPAN_MINUTES') || '43200') + 'm';
                return new JwtService({ secret, signOptions: { expiresIn: expires as StringValue } });
            },
            inject: [ConfigService],
        },
        AuthGuard,
        AuthService,
        MailerService,
    ],
    exports: [AuthGuard, JwtModule, AuthService],
})
export class AuthModule {}
