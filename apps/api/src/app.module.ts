import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CompanyModule } from './company/company.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './common/auth/auth.module';
import { UserMiddleware } from './common/middleware/user.middleware';
import { MailerModule } from './mailer/mailer.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('DATABASE_URL'),
            }),
            inject: [ConfigService],
        }),
        AuthModule,
        CompanyModule,
        MailerModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Applies the UserMiddleware to all routes for optional authentication.
        // It will attempt to extract and verify the JWT on each request,
        // but will not block the request if the token is missing or invalid.
        // This is useful for routes where user context is optional (e.g., personalized content),
        // while authentication enforcement should be handled by AuthGuard on protected routes.
        consumer.apply(UserMiddleware).forRoutes('*');
    }
}
