import { Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserDocument, User } from '../user/user.schema';

@Injectable()
export class MailerService {
    // Maximum failed verification attempts before blocking
    private readonly MAX_VERIFICATION_ATTEMPTS = 5;

    constructor(
        private readonly mailer: NestMailerService,
        private readonly configService: ConfigService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {}

    /**
     * Generate a cryptographically secure 6-digit OTP using crypto.randomInt
     * @returns A 6-digit string OTP padded with leading zeros if necessary
     */
    private generateOtp(): string {
        return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    }

    /**
     * Get the configured "from" email address and name from environment variables
     * @returns Object containing sender name, email address, and formatted from string
     */
    private getFromAddress(): { name: string; email: string; from: string } {
        const name = this.configService.get<string>('MAIL_FROM_NAME') || 'No-Reply';
        const email = this.configService.get<string>('MAIL_FROM_EMAIL');
        return {
            name,
            email: email!,
            from: `"${name}" <${email}>`,
        };
    }

    /**
     * Hash OTP using bcrypt with salt before storing in database
     * @param otp Plain text OTP to hash
     * @returns Hashed OTP string
     */
    private async hashOtp(otp: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(otp, salt);
    }

    /**
     * Verify plain OTP against hashed value using constant-time comparison
     * @param plainOtp Plain text OTP to verify
     * @param hashedOtp Hashed OTP from database
     * @returns True if OTP matches, false otherwise
     */
    private async verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean> {
        return bcrypt.compare(plainOtp, hashedOtp);
    }

    /**
     * Enforce rate limiting for OTP requests to prevent spam
     * @param user User document to check rate limits for
     * @throws {Error} If rate limit is exceeded
     */
    private async enforceRateLimit(user: UserDocument) {
        const now = new Date();
        const windowMs = 60 * 60 * 1; // 1 hour window

        if (!user.lastOtpRequestAt || !user.otpRequestCount) {
            user.otpRequestCount = 0;
            user.lastOtpRequestAt = null;
        }

        if (!user.lastOtpRequestAt || now.getTime() - user.lastOtpRequestAt.getTime() > windowMs) {
            // reset rolling window
            user.otpRequestCount = 0;
        }

        if (user.otpRequestCount >= 5) {
            throw new HttpException(
                'OTP rate limit exceeded. Try again later.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
    }

    /**
     * Send account verification OTP email to user
     * @param email Email address of the user to send verification to
     * @param providedOtp Optional pre-generated OTP for testing purposes
     * @returns True if email was sent successfully
     * @throws {Error} If user is not found or rate limit is exceeded
     */
    async sendVerificationEmail(email: string, providedOtp?: string) {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new NotFoundException('User not found');

        await this.enforceRateLimit(user);

        const otp = providedOtp ?? this.generateOtp();
        const hashedOtp = await this.hashOtp(otp);
        const now = new Date();

        user.emailVerificationCode = hashedOtp;
        user.emailVerificationExpires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
        user.emailVerificationAttempts = 0; // Reset attempts counter when new OTP is generated
        user.otpRequestCount = (user.otpRequestCount || 0) + 1;
        user.lastOtpRequestAt = now;
        await user.save();

        const { from, name } = this.getFromAddress();

        await this.mailer.sendMail({
            to: normalized,
            subject: 'Confirm your account',
            template: 'signupConfirmation',
            from,
            context: {
                otp,
                fromName: name,
            },
        });

        return true;
    }

    /**
     * Send password reset OTP email to user
     * @param email Email address of the user requesting password reset
     * @param providedOtp Optional pre-generated OTP for testing purposes
     * @returns True if email was sent successfully
     * @throws {Error} If user is not found or rate limit is exceeded
     */
    async sendPasswordResetEmail(email: string, providedOtp?: string) {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new NotFoundException('User not found');

        await this.enforceRateLimit(user);

        const otp = providedOtp ?? this.generateOtp();
        const hashedOtp = await this.hashOtp(otp);
        const now = new Date();

        user.passwordResetCode = hashedOtp;
        user.passwordResetExpires = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
        user.passwordResetAttempts = 0; // Reset attempts counter when new OTP is generated
        user.otpRequestCount = (user.otpRequestCount || 0) + 1;
        user.lastOtpRequestAt = now;
        await user.save();

        const { from, name } = this.getFromAddress();

        await this.mailer.sendMail({
            to: normalized,
            subject: 'Password reset request',
            template: 'resetPassword',
            from,
            context: {
                otp,
                fromName: name,
            },
        });

        return true;
    }

    /**
     * Send a simple information email using the info-message template
     * @param email Email address of the recipient
     * @param title Email subject and title
     * @param message Content message to include in the email
     * @returns True if email was sent successfully
     */
    async sendInfoEmail(email: string, title: string, message: string) {
        const normalized = email.toLowerCase();
        const { from, name } = this.getFromAddress();

        await this.mailer.sendMail({
            to: normalized,
            subject: title,
            template: 'infoMessage',
            from,
            context: {
                title,
                message,
                fromName: name,
            },
        });

        return true;
    }

    /**
     * Send a custom template email to a user
     * @param email Email address of the recipient
     * @param templateName Name of the template file (without .hbs extension)
     * @returns True if email was sent successfully
     * @throws {Error} If template file does not exist in templates/ directory
     */
    async sendCustomTemplateEmail(email: string, templateName: string) {
        const normalized = email.toLowerCase();
        const { from, name } = this.getFromAddress();

        await this.mailer.sendMail({
            to: normalized,
            subject: `Notification from ${name}`,
            template: templateName,
            from,
            context: {
                fromName: name,
            },
        });

        return true;
    }

    /**
     * Update user password after successful OTP verification
     * @param email Email address of the user
     * @param newPassword New password to set for the user
     * @returns True if password was updated successfully
     * @throws {Error} If user is not found
     */
    async updatePassword(email: string, newPassword: string): Promise<boolean> {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new NotFoundException('User not found');

        user.password = newPassword;
        await user.save();
        return true;
    }

    /**
     * Verify a previously issued signup OTP with brute-force protection
     * @param email Email address of the user
     * @param otp Plain text OTP to verify
     * @returns True if verification is successful
     * @throws {Error} If user is not found, OTP is invalid, expired, or too many attempts
     */
    async verifySignupOtp(email: string, otp: string) {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new NotFoundException('User not found');

        if (!user.emailVerificationCode || !user.emailVerificationExpires) {
            throw new BadRequestException('No verification code set');
        }

        // Check expiration first
        const now = new Date();
        if (now.getTime() > user.emailVerificationExpires.getTime()) {
            // Clear expired OTP
            user.emailVerificationCode = null;
            user.emailVerificationExpires = null;
            user.emailVerificationAttempts = 0;
            await user.save();
            throw new BadRequestException('OTP expired');
        }

        // Check brute-force protection
        if (user.emailVerificationAttempts >= this.MAX_VERIFICATION_ATTEMPTS) {
            // Invalidate OTP after too many attempts
            user.emailVerificationCode = null;
            user.emailVerificationExpires = null;
            user.emailVerificationAttempts = 0;
            await user.save();
            throw new BadRequestException('Too many verification attempts. Please request a new code.');
        }

        // Verify OTP using constant-time comparison
        const isValid = await this.verifyOtp(otp, user.emailVerificationCode);

        if (!isValid) {
            // Increment failed attempts counter
            user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
            await user.save();
            throw new BadRequestException('Invalid OTP');
        }

        // Success: Mark as verified and clear OTP (single-use)
        user.isVerified = true;
        user.emailVerificationCode = null;
        user.emailVerificationExpires = null;
        user.emailVerificationAttempts = 0;
        await user.save();
        return true;
    }

    /**
     * Verify a password reset OTP with brute-force protection
     * @param email Email address of the user
     * @param otp Plain text OTP to verify
     * @returns User document if verification is successful
     * @throws {Error} If user is not found, OTP is invalid, expired, or too many attempts
     */
    async verifyPasswordResetOtp(email: string, otp: string) {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new NotFoundException('User not found');

        if (!user.passwordResetCode || !user.passwordResetExpires) {
            throw new BadRequestException('No password reset code set');
        }

        // Check expiration first
        const now = new Date();
        if (now.getTime() > user.passwordResetExpires.getTime()) {
            // Clear expired OTP
            user.passwordResetCode = null;
            user.passwordResetExpires = null;
            user.passwordResetAttempts = 0;
            await user.save();
            throw new BadRequestException('OTP expired');
        }

        // Check brute-force protection
        if (user.passwordResetAttempts >= this.MAX_VERIFICATION_ATTEMPTS) {
            // Invalidate OTP after too many attempts
            user.passwordResetCode = null;
            user.passwordResetExpires = null;
            user.passwordResetAttempts = 0;
            await user.save();
            throw new HttpException(
                'Too many verification attempts. Please request a new code.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // Verify OTP using constant-time comparison
        const isValid = await this.verifyOtp(otp, user.passwordResetCode);

        if (!isValid) {
            // Increment failed attempts counter
            user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
            await user.save();
            throw new BadRequestException('Invalid OTP');
        }

        // Success: Clear OTP (single-use) but keep user object for password update
        user.passwordResetCode = null;
        user.passwordResetExpires = null;
        user.passwordResetAttempts = 0;
        await user.save();

        return user;
    }
}
