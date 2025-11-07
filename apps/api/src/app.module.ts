import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CompanyModule } from './company/company.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './common/auth/auth.module';
import { UserMiddleware } from './common/middleware/user.middleware';

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
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Applique le UserMiddleware sur toutes les routes
        // Il tentera d'extraire et de vérifier le JWT sur chaque requête
        // mais ne bloquera pas la requête si le token est absent ou invalide
        consumer.apply(UserMiddleware).forRoutes('*');
    }
}
