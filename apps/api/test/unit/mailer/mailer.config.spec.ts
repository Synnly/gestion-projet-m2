import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerConfigService } from '../../../src/mailer/mailer.config';

describe('MailerConfigService', () => {
    let service: MailerConfigService;
    let configService: ConfigService;

    const createModule = async (configValues: Record<string, string | undefined>) => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailerConfigService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => configValues[key]),
                    },
                },
            ],
        }).compile();

        service = module.get<MailerConfigService>(MailerConfigService);
        configService = module.get<ConfigService>(ConfigService);
    };

    describe('createMailerOptions', () => {
        it('should create mailer options with all required env variables', async () => {
            await createModule({
                MAIL_USER: 'test@gmail.com',
                MAIL_PASS: 'testpassword',
                MAIL_FROM_NAME: 'Test App',
                MAIL_FROM_EMAIL: 'noreply@test.com',
            });

            const options = service.createMailerOptions();

            expect(options).toBeDefined();
            expect(options.transport).toMatchObject({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'test@gmail.com',
                    pass: 'testpassword',
                },
            });
            expect(options.defaults).toMatchObject({
                from: '"Test App" <noreply@test.com>',
                replyTo: 'noreply@test.com',
            });
            expect(options.template).toBeDefined();
        });

        it('should throw error when MAIL_USER is missing', async () => {
            await createModule({
                MAIL_USER: undefined,
                MAIL_PASS: 'testpassword',
                MAIL_FROM_NAME: 'Test App',
                MAIL_FROM_EMAIL: 'noreply@test.com',
            });

            expect(() => service.createMailerOptions()).toThrow(
                'Missing required email configuration: MAIL_USER, MAIL_PASS, MAIL_FROM_NAME, and MAIL_FROM_EMAIL must be set',
            );
        });

        it('should throw error when MAIL_PASS is missing', async () => {
            await createModule({
                MAIL_USER: 'test@gmail.com',
                MAIL_PASS: undefined,
                MAIL_FROM_NAME: 'Test App',
                MAIL_FROM_EMAIL: 'noreply@test.com',
            });

            expect(() => service.createMailerOptions()).toThrow(
                'Missing required email configuration: MAIL_USER, MAIL_PASS, MAIL_FROM_NAME, and MAIL_FROM_EMAIL must be set',
            );
        });

        it('should throw error when MAIL_FROM_NAME is missing', async () => {
            await createModule({
                MAIL_USER: 'test@gmail.com',
                MAIL_PASS: 'testpassword',
                MAIL_FROM_NAME: undefined,
                MAIL_FROM_EMAIL: 'noreply@test.com',
            });

            expect(() => service.createMailerOptions()).toThrow(
                'Missing required email configuration: MAIL_USER, MAIL_PASS, MAIL_FROM_NAME, and MAIL_FROM_EMAIL must be set',
            );
        });

        it('should throw error when MAIL_FROM_EMAIL is missing', async () => {
            await createModule({
                MAIL_USER: 'test@gmail.com',
                MAIL_PASS: 'testpassword',
                MAIL_FROM_NAME: 'Test App',
                MAIL_FROM_EMAIL: undefined,
            });

            expect(() => service.createMailerOptions()).toThrow(
                'Missing required email configuration: MAIL_USER, MAIL_PASS, MAIL_FROM_NAME, and MAIL_FROM_EMAIL must be set',
            );
        });

        it('should throw error when all env variables are missing', async () => {
            await createModule({
                MAIL_USER: undefined,
                MAIL_PASS: undefined,
                MAIL_FROM_NAME: undefined,
                MAIL_FROM_EMAIL: undefined,
            });

            expect(() => service.createMailerOptions()).toThrow(
                'Missing required email configuration: MAIL_USER, MAIL_PASS, MAIL_FROM_NAME, and MAIL_FROM_EMAIL must be set',
            );
        });
    });
});
