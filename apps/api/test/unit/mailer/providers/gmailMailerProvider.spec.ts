import { Test, TestingModule } from '@nestjs/testing';
import { GmailMailerProvider } from '../../../../src/mailer/providers/GmailMailerProvider';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

describe('GmailMailerProvider', () => {
    let provider: GmailMailerProvider;
    let nestMailer: jest.Mocked<Partial<NestMailerService>>;

    const mockNestMailer = {
        sendMail: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const cfg: Record<string, string> = {
                MAIL_FROM_NAME: 'Test App',
                MAIL_FROM_EMAIL: 'noreply@example.com',
            };
            return cfg[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GmailMailerProvider,
                { provide: NestMailerService, useValue: mockNestMailer },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        provider = module.get<GmailMailerProvider>(GmailMailerProvider);
        nestMailer = module.get<any>(NestMailerService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(provider).toBeDefined();
    });

    it('should send template email using default from and replyTo', async () => {
        mockNestMailer.sendMail.mockResolvedValue(true);

        await provider.sendMail({
            to: 'user@example.com',
            subject: 'Test',
            template: 'signupConfirmation',
            context: { otp: '123456' },
        });

        expect(nestMailer.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'user@example.com',
                subject: 'Test',
                template: 'signupConfirmation',
                context: expect.objectContaining({ otp: '123456' }),
                from: '"Test App" <noreply@example.com>',
                replyTo: 'noreply@example.com',
            }),
        );
    });

    it('should send html when no template provided', async () => {
        mockNestMailer.sendMail.mockResolvedValue(true);

        await provider.sendMail({
            to: 'a@b.com',
            subject: 'HTML',
            html: '<p>Hello</p>',
        });

        expect(nestMailer.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'a@b.com',
                subject: 'HTML',
                html: '<p>Hello</p>',
                from: '"Test App" <noreply@example.com>',
            }),
        );
    });

    it('should rethrow errors from underlying mailer', async () => {
        mockNestMailer.sendMail.mockRejectedValue(new Error('send failed'));

        await expect(provider.sendMail({ to: 'x@y.com', subject: 'Err', html: 'x' })).rejects.toThrow('send failed');
    });
});
