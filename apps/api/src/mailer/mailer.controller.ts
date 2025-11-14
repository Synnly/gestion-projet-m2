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
import { SendCustomTemplateDto } from './dto/send-custom-template.dto';
import { AuthGuard } from '../common/auth/auth.guard';

/**
 * Controller handling email operations: password reset, account verification, and custom templates
 */
@Controller()
export class MailerController {
    constructor(private readonly mailerService: MailerService) {}

    /**
     * Request a password reset OTP
     * POST /password/forgot
     * Public route - sends OTP valid for 5 minutes
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
     * Reset password with OTP
     * POST /password/reset
     * Public route - verifies OTP and updates password
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
            throw new BadRequestException('Failed to reset password');
        }
    }

    /**
     * Send account verification OTP
     * POST /auth/send-verification
     * Public route - sends OTP valid for 1 hour
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
     * Verify account with OTP
     * POST /auth/verify
     * Public route - validates OTP and marks account as verified
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
            throw new BadRequestException('Failed to verify account');
        }
    }

    /**
     * Send custom template email to authenticated user
     * POST /mailer/send-template
     * Protected route - requires authentication
     * Template file must exist as {templateName}.hbs in templates/
     */
    @Post('mailer/send-template')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async sendCustomTemplate(@Request() req, @Body() dto: SendCustomTemplateDto) {
        try {
            const userEmail = req.user.email;
            
            if (!userEmail) {
                throw new BadRequestException('User email not found in token');
            }

            await this.mailerService.sendCustomTemplateEmail(
                userEmail,
                dto.templateName,
            );

            return {
                success: true,
                message: `Email sent successfully using template: ${dto.templateName}`,
            };
        } catch (error) {
            if (error.message?.includes('template')) {
                throw new NotFoundException(`Template '${dto.templateName}' not found`);
            }
            throw new BadRequestException('Failed to send email');
        }
    }
}
