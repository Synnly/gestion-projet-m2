import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CompanyModule } from './company/company.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TokensMiddleware } from './common/middleware/tokens.middleware';
import { S3Module } from './s3/s3.module';
import { MailerModule } from './mailer/mailer.module';
import { PostModule } from './post/post.module';
import { MailerProviderType } from './mailer/constants';
import { StudentModule } from './student/student.module';
import { ApplicationModule } from './application/application.module';
import { StorageProviderType } from './s3/s3.constants';
import { StatsModule } from './stats/stats.module';
import { SeedModule } from './seed/seed.module';
import { AdminModule } from './admin/admin.module';
import { ForumModule } from './forum/forum.module';
import { NotificationModule } from './notification/notification.module';
import { UsersModule } from './user/user.module';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MailerModule.register(MailerProviderType.gmail),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('DATABASE_URL'),
            }),
            inject: [ConfigService],
        }),
        S3Module.register({ provider: StorageProviderType.MINIO }),
        AuthModule,
        CompanyModule,
        PostModule,
        MailerModule,
        StudentModule,
        AdminModule,
        ForumModule,
        SeedModule,
        ApplicationModule,
        StatsModule,
        NotificationModule,
        UsersModule,
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
