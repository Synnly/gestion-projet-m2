import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { IMailerProvider, SendMailOptions } from '../interfaces/IMailerProvider';
import { ConfigService } from '@nestjs/config';

/**
 * Gmail-based mailer adapter implementing the `IMailerProvider` interface.
 *
 * This class adapts application-level `SendMailOptions` to the payload
 * expected by `@nestjs-modules/mailer` and delegates sending to the
 * underlying `NestMailerService` (SMTP transport configured elsewhere).
 */
@Injectable()
export class GmailMailerProvider implements IMailerProvider {
    private readonly logger = new Logger(GmailMailerProvider.name);
    private readonly defaultFrom: string;
    private readonly replyTo?: string;

    /**
     * Create a new GmailMailerProvider.
     * @param mailer Underlying Nest mailer service used to actually send messages
     * @param configService Config service used to read default sender info
     */
    constructor(
        private readonly mailer: NestMailerService,
        private readonly configService: ConfigService,
    ) {
        const name = this.configService.get<string>('MAIL_FROM_NAME') || 'No-Reply';
        const email = this.configService.get<string>('MAIL_FROM_EMAIL');
        this.replyTo = email || undefined;
        this.defaultFrom = email ? `"${name}" <${email}>` : `no-reply@localhost`;
    }

    /**
     * Send an email by converting `SendMailOptions` into the payload that
     * `@nestjs-modules/mailer` expects. Uses template rendering when
     * `options.template` is provided; otherwise sends `html` body.
     *
     * Errors from the underlying mailer are logged and re-thrown.
     *
     * @param options Options describing recipient, subject and body/template
     */
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
