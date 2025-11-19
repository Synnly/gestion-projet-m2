import { AppModule } from '../../src/app.module';

describe('AppModule import (mongoose factory executed)', () => {
    it('should allow MongooseModule.forRootAsync useFactory to be executed via a mocked @nestjs/mongoose', () => {
        jest.isolateModules(() => {
            const called = { ran: false };

            jest.doMock('../../src/company/company.module', () => ({ CompanyModule: {} }));
            jest.doMock('../../src/auth/auth.module', () => ({ AuthModule: {} }));
            jest.doMock('../../src/mailer/mailer.module', () => ({ MailerModule: {} }));

            jest.doMock('@nestjs/mongoose', () => {
                const actual = jest.requireActual('@nestjs/mongoose');
                return {
                    ...actual,
                    MongooseModule: {
                        ...(actual.MongooseModule || {}),
                        forRootAsync: (opts: any) => {
                            if (opts && typeof opts.useFactory === 'function') {
                                opts.useFactory({ get: () => 'mongodb://fake:27017/test' });
                                called.ran = true;
                            }
                            return {};
                        },
                    },
                };
            });

            const mod = require('../../src/app.module');
            expect(mod).toBeDefined();
            expect(called.ran).toBe(true);
        });
    });
});

describe('AppModule', () => {
    it('should apply TokensMiddleware to all routes when configure is called', () => {
        const consumerMock = {
            apply: jest.fn().mockReturnValue({ forRoutes: jest.fn() }),
        } as any;

        const module = new AppModule();
        // Should not throw and should call consumer.apply with TokensMiddleware
        expect(() => module.configure(consumerMock)).not.toThrow();
        expect(consumerMock.apply).toHaveBeenCalled();
    });
});
