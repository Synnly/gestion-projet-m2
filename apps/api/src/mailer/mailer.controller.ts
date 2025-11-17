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
    async forgotPassword(@Body() dto: EmailDto) {
        try {
            await this.mailerService.sendPasswordResetEmail(dto.email);
            return {
                success: true,
                message: 'Password reset code sent to your email. Valid for 5 minutes.',
            };
        } catch (error) {
            if (error.message === 'User not found') {
                throw new NotFoundException('No account found with this email');
            }
            if (error.message === 'OTP rate limit exceeded. Try again later.') {
                throw new BadRequestException('Too many requests. Please try again later.');
            }
            throw new BadRequestException('Failed to send password reset email');
        }
    }

    /**
     * Reset user password using OTP verification
     * @param dto Contains email, OTP code and new password
     * @returns Success response confirming password reset
     * @throws {NotFoundException} If no account is found with the provided email
     * @throws {BadRequestException} If OTP is invalid, expired, or password reset fails
     */
    @Post('password/reset')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        try {
            // Verify OTP first
            await this.mailerService.verifyPasswordResetOtp(dto.email, dto.otp);

            // Update password
            await this.mailerService.updatePassword(dto.email, dto.newPassword);

            return {
                success: true,
                message: 'Password successfully reset',
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
    @HttpCode(HttpStatus.OK)
    async sendVerification(@Body() dto: EmailDto) {
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
    async verifyAccount(@Body() dto: VerifyOtpDto) {
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
    async sendCustomTemplate(@Request() req, @Body() dto: SendCustomTemplateDto) {
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
