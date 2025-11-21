import {
    Body,
    Controller,
    Post,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
    BadRequestException,
    NotFoundException,
    ValidationPipe,
} from '@nestjs/common';
import { MailerService } from './mailer.service';
import { EmailDto, VerifyOtpDto, ResetPasswordDto } from './dto/mailer.dto';
import { SendCustomTemplateDto } from './dto/sendCustomTemplate.dto';
import { AuthGuard } from '../auth/auth.guard';

/**
 * Controller handling email operations: password reset, account verification, and custom templates
 */
@Controller('/api/mailer')
export class MailerController {
    constructor(private readonly mailerService: MailerService) {}

    /**
     * Request a password reset OTP via email
     * @param dto Email address of the user requesting password reset
     * @returns Success response with confirmation message
     * @throws {NotFoundException} If no account is found with the provided email
     * @throws {BadRequestException} If rate limit is exceeded or email sending fails
     */
    @Post('password/forgot')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) dto: EmailDto,
    ) {
        try {
            await this.mailerService.sendPasswordResetEmail(dto.email);
            return {
                success: true,
                message: 'Password reset code sent to your email. Valid for 5 minutes.',
            };
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'User not found') {
                    throw new NotFoundException('No account found with this email');
                }
                if (error.message === 'OTP rate limit exceeded. Try again later.') {
                    throw new BadRequestException('Too many requests. Please try again later.');
                }
                throw new BadRequestException('Failed to send password reset email');
            }
        }
    }

    @Post('password/reset/verify-otp')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: VerifyOtpDto,
    ) {
        try {
            await this.mailerService.verifyPasswordResetOtp(dto.email, dto.otp);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'User not found') {
                    throw new NotFoundException('No account found with this email');
                }
                if (error.message === 'Invalid OTP' || error.message === 'OTP expired') {
                    throw new BadRequestException(error.message);
                }
                if (error.message === 'Too many verification attempts. Please request a new code.') {
                    throw new BadRequestException(error.message);
                }
                throw new BadRequestException('Failed to verify OTP');
            }
        }

        return {
            success: true,
            message: 'OTP successfully verified',
        };
    }

    /**
     * Reset user password after OTP verification
     * @param dto Contains email and new password (OTP must have been verified via /verify-otp first)
     * @returns Success response confirming password reset
     * @throws {NotFoundException} If no account is found with the provided email
     * @throws {BadRequestException} If OTP was not verified, validation expired, or password reset fails
     */
    @Post('password/reset')
    @HttpCode(HttpStatus.OK)
    async resetPassword(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: ResetPasswordDto,
    ) {
        try {
            // Update password (will verify that OTP was validated recently)
            await this.mailerService.updatePassword(dto.email, dto.newPassword);

            return {
                success: true,
                message: 'Password successfully reset',
            };
        } catch (error) {
            if (error.message === 'User not found') {
                throw new NotFoundException('No account found with this email');
            }
            if (
                error.message === 'Password reset not verified. Please verify OTP first.' ||
                error.message === 'Password reset validation expired. Please verify OTP again.'
            ) {
                throw new BadRequestException(error.message);
            }
            throw new BadRequestException('Failed to reset password');
        }
    }

    /**
     * Send account verification OTP via email
     * @param dto Email address of the user to verify
     * @returns Success response with confirmation message
     * @throws {NotFoundException} If no account is found with the provided email
     * @throws {BadRequestException} If rate limit is exceeded or email sending fails
     */
    @Post('auth/send-verification')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async sendVerification(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) dto: EmailDto,
    ) {
        try {
            await this.mailerService.sendVerificationEmail(dto.email);
            return {
                success: true,
                message: 'Verification code sent to your email. Valid for 1 hour.',
            };
        } catch (error) {
            if (error.message === 'User not found') {
                throw new NotFoundException('No account found with this email');
            }
            if (error.message === 'OTP rate limit exceeded. Try again later.') {
                throw new BadRequestException('Too many requests. Please try again later.');
            }
            throw new BadRequestException('Failed to send verification email');
        }
    }

    /**
     * Verify user account using OTP code
     * @param dto Contains email and OTP code for verification
     * @returns Success response confirming account verification
     * @throws {NotFoundException} If no account is found with the provided email
     * @throws {BadRequestException} If OTP is invalid, expired, or verification fails
     */
    @Post('auth/verify')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    async verifyAccount(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) dto: VerifyOtpDto,
    ) {
        try {
            await this.mailerService.verifySignupOtp(dto.email, dto.otp);
            return {
                success: true,
                message: 'Account successfully verified',
            };
        } catch (error) {
            if (error.message === 'User not found') {
                throw new NotFoundException('No account found with this email');
            }
            if (error.message === 'Invalid OTP' || error.message === 'OTP expired') {
                throw new BadRequestException(error.message);
            }
            if (error.message === 'Too many verification attempts. Please request a new code.') {
                throw new BadRequestException(error.message);
            }
            throw new BadRequestException('Failed to verify account');
        }
    }

    /**
     * Send custom template email to authenticated user
     * @param req HTTP request containing authenticated user information
     * @param dto Contains the template name to use for the email
     * @returns Success response confirming email was sent
     * @throws {BadRequestException} If user email is not found in token or email sending fails
     * @throws {NotFoundException} If the specified template file does not exist
     */
    @Post('send-template')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async sendCustomTemplate(
        @Request() req,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: SendCustomTemplateDto,
    ) {
        try {
            const userEmail = req.user.email;

            if (!userEmail) {
                throw new BadRequestException('User email not found in token');
            }

            await this.mailerService.sendCustomTemplateEmail(userEmail, dto.templateName);

            return {
                success: true,
                message: `Email sent successfully using template: ${dto.templateName}`,
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            if (error.message?.includes('template')) {
                throw new NotFoundException(`Template '${dto.templateName}' not found`);
            }
            throw new BadRequestException('Failed to send email');
        }
    }
}
