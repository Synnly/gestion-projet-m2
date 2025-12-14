/**
 * Options passed to the mailer adapter when sending an email.
 *
 * - `to`: recipient email address
 * - `subject`: message subject
 * - `template`: optional template name (template engine will be used when present)
 * - `context`: template rendering context / arbitrary metadata
 * - `html`: raw HTML body (used when no template)
 * - `from`: optional override for sender address
 * - `replyTo`: optional reply-to address
 */
export interface SendMailOptions {
    to: string;
    subject: string;
    template?: string;
    context?: Record<string, any>;
    html?: string;
    from?: string;
    replyTo?: string;
}

/**
 * Adapter interface for mail providers.
 *
 * Implementations of this interface adapt the application-level mail
 * requests (`SendMailOptions`) to a concrete third-party mail service
 * (SMTP client, Sendgrid, SES, etc.). The rest of the application depends
 * only on this interface, allowing provider swaps without changing clients.
 */
export interface IMailerProvider {
    /**
     * Send an email according to the provided options.
     * @param options SendMailOptions containing recipient, subject and payload
     */
    sendMail(options: SendMailOptions): Promise<void>;
}
