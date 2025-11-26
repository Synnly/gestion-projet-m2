export interface SendMailOptions {
    to: string;
    subject: string;
    template?: string;
    context?: Record<string, any>;
    html?: string;
    from?: string;
    replyTo?: string;
}

export interface IMailerProvider {
    sendMail(options: SendMailOptions): Promise<void>;
}
