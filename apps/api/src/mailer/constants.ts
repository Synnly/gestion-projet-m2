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
