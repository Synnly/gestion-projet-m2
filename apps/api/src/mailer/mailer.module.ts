import { DynamicModule, Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { MailerConfigService } from './mailer.config';
import { MailerService } from './mailer.service';
import { MailerController } from './mailer.controller';
import { GmailMailerProvider } from './providers/GmailMailerProvider';
import { MAILER_PROVIDER, MailerProviderType } from './constants';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.schema';

/**
 * Mailer module that registers the chosen provider adapter and exposes
 * `MailerService` to the application. Use `MailerModule.register(type)` to
 * configure which provider implementation (adapter) should be bound to the
 * `MAILER_PROVIDER` token.
 */

@Module({})
export class MailerModule {
    /**
     * Register the mailer module with a selected provider implementation.
     *
     * @param type Provider type to register (defaults to `MailerProviderType.gmail`).
     * @returns Nest DynamicModule configured with the provider and mailer config
     */
    static register(type: MailerProviderType = MailerProviderType.gmail): DynamicModule {
        const provider =
            type === MailerProviderType.gmail
                ? { provide: MAILER_PROVIDER, useClass: GmailMailerProvider }
                : { provide: MAILER_PROVIDER, useClass: GmailMailerProvider }; // fallback

        return {
            module: MailerModule,
            imports: [
                ConfigModule,
                MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
                NestMailerModule.forRootAsync({
                    imports: [ConfigModule],
                    useClass: MailerConfigService,
                }),
            ],
            controllers: [MailerController],
            providers: [provider, MailerService, MailerConfigService],
            exports: [MailerService, provider],
        };
    }
}
