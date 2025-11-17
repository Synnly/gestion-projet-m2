import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CompanyModule } from './company/company.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TokensMiddleware } from './common/middleware/tokens.middleware';
import { MailerModule } from './mailer/mailer.module';
import { PostModule } from './post/post.module';

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
        PostModule,
        MailerModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Applies the TokensMiddleware to all routes for optional authentication.
        // It will attempt to extract and verify the access token on each request,
        // but will not block the request if the token is missing or invalid.
        // This is useful for routes where user context is optional (e.g., personalized content),
        // while authentication enforcement should be handled by AuthGuard on protected routes.
        consumer.apply(TokensMiddleware).forRoutes('*');
    }
}
