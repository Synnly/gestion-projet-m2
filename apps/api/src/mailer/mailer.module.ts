import { DynamicModule, Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { MailerConfigService } from './mailer.config';
import { MailerService } from './mailer.service';
import { MailerController } from './mailer.controller';
import { GmailMailerProvider } from './providers/GmailMailerProvider';
import { MAILER_PROVIDER, MailerProviderType } from './constants';

@Module({})
export class MailerModule {
    static register(type: MailerProviderType = MailerProviderType.gmail): DynamicModule {
        const provider =
            type === MailerProviderType.gmail
                ? { provide: MAILER_PROVIDER, useClass: GmailMailerProvider }
                : { provide: MAILER_PROVIDER, useClass: GmailMailerProvider }; // fallback

        return {
            module: MailerModule,
            imports: [
                ConfigModule,
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
