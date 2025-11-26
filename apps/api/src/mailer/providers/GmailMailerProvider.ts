import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { IMailerProvider, SendMailOptions } from '../interfaces/IMailerProvider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GmailMailerProvider implements IMailerProvider {
    private readonly logger = new Logger(GmailMailerProvider.name);
    private readonly defaultFrom: string;
    private readonly replyTo?: string;

    constructor(
        private readonly mailer: NestMailerService,
        private readonly configService: ConfigService,
    ) {
        const name = this.configService.get<string>('MAIL_FROM_NAME') || 'No-Reply';
        const email = this.configService.get<string>('MAIL_FROM_EMAIL');
        this.replyTo = email || undefined;
        this.defaultFrom = email ? `"${name}" <${email}>` : `no-reply@localhost`;
    }

    async sendMail(options: SendMailOptions): Promise<void> {
        try {
            const payload = {
                to: options.to,
                subject: options.subject,
                from: options.from ?? this.defaultFrom,
                replyTo: options.replyTo ?? this.replyTo,
                ...(options.template
                    ? { template: options.template, context: options.context ?? {} }
                    : { html: options.html ?? options.context?.html ?? '' }),
            };

            await this.mailer.sendMail(payload as any);
        } catch (err) {
            this.logger.error('Failed to send mail', (err as Error).stack ?? err);
            throw err;
        }
    }
}
