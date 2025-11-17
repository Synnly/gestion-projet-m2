import { MailerService } from '../../../src/mailer/mailer.service';

describe('MailerService private helpers', () => {
    const fakeMailer = { sendMail: jest.fn() } as any;
    const fakeConfig = {
        get: jest.fn((k: string) => (k === 'MAIL_FROM_EMAIL' ? 'from@example.com' : undefined)),
    } as any;
    const fakeUserModel = {} as any;
    const svc = new MailerService(fakeMailer, fakeConfig, fakeUserModel);

    it('generateOtp should return 6-digit string', () => {
        const otp = (svc as any).generateOtp();
        expect(typeof otp).toBe('string');
        expect(otp.length).toBe(6);
    });

    it('getFromAddress should return formatted from value', () => {
        const res = (svc as any).getFromAddress();
        expect(res).toHaveProperty('from');
        expect(res.email).toBe('from@example.com');
    });

    it('hashOtp and verifyOtp should be consistent', async () => {
        const plain = '123456';
        const hashed = await (svc as any).hashOtp(plain);
        expect(typeof hashed).toBe('string');
        const ok = await (svc as any).verifyOtp(plain, hashed);
        expect(ok).toBe(true);
    });
});
