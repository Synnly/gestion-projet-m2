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
