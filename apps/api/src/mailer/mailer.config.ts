import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { MailerProviderType, MAIL_PROVIDER_HOST, MAIL_PROVIDER_PORT } from './constants';
import { InvalidConfigurationException } from '../common/exceptions/invalidConfiguration.exception';

@Injectable()
export class MailerConfigService implements MailerOptionsFactory {
    constructor(private configService: ConfigService) {}
    /**
     * Create mailer options for NestJS MailerModule configuration.
     *
     * Reads SMTP credentials and template settings from environment
     * variables via `ConfigService` and returns a `MailerOptions` object
     * consumed by `@nestjs-modules/mailer`.
     *
     * @returns Mailer configuration object with SMTP transport and Handlebars templates
     */
    createMailerOptions(): MailerOptions {
        const user = this.configService.get<string>('MAIL_USER');
        const pass = this.configService.get<string>('MAIL_PASS');
        const fromName = this.configService.get<string>('MAIL_FROM_NAME');
        const fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL');

        const templatesDir = path.resolve(
            __dirname,
            process.env.NODE_ENV === 'production' ? 'templates' : '../../src/mailer/templates',
        );
        if (!user || !pass || !fromName || !fromEmail) {
            throw new InvalidConfigurationException(
                'Missing required email configuration: MAIL_USER, MAIL_PASS, MAIL_FROM_NAME, and MAIL_FROM_EMAIL must be set',
            );
        }
        return {
            transport: {
                host: MAIL_PROVIDER_HOST[MailerProviderType.gmail],
                port: MAIL_PROVIDER_PORT[MailerProviderType.gmail],
                secure: false,
                auth: {
                    user,
                    pass,
                },
            },
            defaults: {
                from: `"${fromName}" <${fromEmail}>`,
                replyTo: fromEmail,
            },
            template: {
                dir: templatesDir,
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true,
                },
            },
        };
    }
}
