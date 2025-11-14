import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class MailerConfigService implements MailerOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMailerOptions(): MailerOptions {
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const fromName = this.configService.get<string>('MAIL_FROM_NAME') || 'No-Reply';
    const fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL');

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
        dir: path.join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    };
  }
}
