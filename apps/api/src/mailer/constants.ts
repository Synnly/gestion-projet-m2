/**
 * Dependency injection token used to bind a concrete mailer provider
 * implementation (adapter) in the NestJS module.
 *
 * Example: provide `MAILER_PROVIDER` with `useClass: GmailMailerProvider`.
 */
export const MAILER_PROVIDER = Symbol('MAILER_PROVIDER');

/**
 * Supported provider implementations for the mailer adapter.
 *
 * Add new providers here when implementing other email transports (e.g. Sendgrid).
 */
export enum MailerProviderType {
    /** Gmail SMTP-based provider */
    gmail = 'gmail',
}

/**
 * Map each mailer provider type to its SMTP host.
 * Add other providers here when implementing new transports.
 */
export const MAIL_PROVIDER_HOST: Record<MailerProviderType, string> = {
    [MailerProviderType.gmail]: 'smtp.gmail.com',
};
