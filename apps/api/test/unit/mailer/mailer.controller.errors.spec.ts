import { MailerController } from '../../../src/mailer/mailer.controller';
import { MailerService } from '../../../src/mailer/mailer.service';
import { EmailDto, ResetPasswordDto, VerifyOtpDto } from '../../../src/mailer/dto/mailer.dto';
import { SendCustomTemplateDto } from '../../../src/mailer/dto/send-custom-template.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MailerController error branches', () => {
    let controller: MailerController;
    const mockSvc: Partial<MailerService> = {};

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new MailerController(mockSvc as MailerService);
    });

    it('forgotPassword should translate "User not found" to NotFoundException', async () => {
        mockSvc.sendPasswordResetEmail = jest.fn().mockRejectedValue(new Error('User not found'));
        await expect(controller.forgotPassword({ email: 'a@a.com' } as EmailDto)).rejects.toThrow(NotFoundException);
    });

    it('forgotPassword should translate rate limit error to BadRequestException', async () => {
        mockSvc.sendPasswordResetEmail = jest
            .fn()
            .mockRejectedValue(new Error('OTP rate limit exceeded. Try again later.'));
        await expect(controller.forgotPassword({ email: 'a@a.com' } as EmailDto)).rejects.toThrow(BadRequestException);
    });

    it('resetPassword should translate Invalid OTP to BadRequestException', async () => {
        mockSvc.verifyPasswordResetOtp = jest.fn().mockRejectedValue(new Error('Invalid OTP'));
        mockSvc.updatePassword = jest.fn();
        const dto: ResetPasswordDto = { email: 'a@a.com', otp: '000000', newPassword: 'P@ssw0rd' };
        await expect(controller.resetPassword(dto)).rejects.toThrow(BadRequestException);
    });

    it('sendVerification should translate User not found', async () => {
        mockSvc.sendVerificationEmail = jest.fn().mockRejectedValue(new Error('User not found'));
        await expect(controller.sendVerification({ email: 'a@a.com' } as EmailDto)).rejects.toThrow(NotFoundException);
    });

    it('verifyAccount should translate OTP expired to BadRequestException', async () => {
        mockSvc.verifySignupOtp = jest.fn().mockRejectedValue(new Error('OTP expired'));
        await expect(controller.verifyAccount({ email: 'a@a.com', otp: '123456' } as VerifyOtpDto)).rejects.toThrow(
            BadRequestException,
        );
    });

    it('sendCustomTemplate should throw NotFoundException when template-related error is thrown', async () => {
        mockSvc.sendCustomTemplateEmail = jest.fn().mockRejectedValue(new Error('template not found on disk'));
        const req = { user: { email: 'a@a.com' } } as any;
        await expect(
            controller.sendCustomTemplate(req, { templateName: 'missing' } as SendCustomTemplateDto),
        ).rejects.toThrow(NotFoundException);
    });

    it('sendCustomTemplate should rethrow BadRequestException as-is', async () => {
        mockSvc.sendCustomTemplateEmail = jest.fn().mockRejectedValue(new BadRequestException('bad'));
        const req = { user: { email: 'a@a.com' } } as any;
        await expect(
            controller.sendCustomTemplate(req, { templateName: 't' } as SendCustomTemplateDto),
        ).rejects.toThrow(BadRequestException);
    });
});
