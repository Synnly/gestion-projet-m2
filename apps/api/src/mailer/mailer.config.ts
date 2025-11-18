import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class MailerConfigService implements MailerOptionsFactory {
    constructor(private configService: ConfigService) {}

    /**
     * Create mailer options for NestJS MailerModule configuration
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
            throw new Error(
                'Missing required email configuration: MAIL_USER, MAIL_PASS, MAIL_FROM_NAME, and MAIL_FROM_EMAIL must be set',
            );
        }
        return {
            transport: {
                host: 'smtp.gmail.com',
                port: 587,
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
