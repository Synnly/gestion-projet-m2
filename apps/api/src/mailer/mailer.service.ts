import { Injectable } from '@nestjs/common';
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
     * Generate a cryptographically secure 6-digit OTP
     * Uses crypto.randomInt for true randomness
     */
    private generateOtp(): string {
        return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    }

    /**
     * Get the configured "from" email address and name
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
     * Hash OTP using bcrypt before storing in database
     * Protects OTP if database is compromised
     */
    private async hashOtp(otp: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(otp, salt);
    }

    /**
     * Verify OTP against hashed value using constant-time comparison
     */
    private async verifyOtp(plainOtp: string, hashedOtp: string): Promise<boolean> {
        return bcrypt.compare(plainOtp, hashedOtp);
    }

    private async enforceRateLimit(user: UserDocument) {
        const now = new Date();
        const windowMs = 60 * 60 * 1000; // 1 hour window

        if (!user.lastOtpRequestAt || !user.otpRequestCount) {
            user.otpRequestCount = 0;
            user.lastOtpRequestAt = null;
        }

        if (!user.lastOtpRequestAt || now.getTime() - user.lastOtpRequestAt.getTime() > windowMs) {
            // reset rolling window
            user.otpRequestCount = 0;
        }

        if (user.otpRequestCount >= 5) {
            throw new Error('OTP rate limit exceeded. Try again later.');
        }
    }

    /**
     * Send account verification OTP. Valid for 1 hour.
     * Respects per-user anti-spam limits (max 5 per hour).
     * OTP is hashed before storage for security.
     */
    async sendVerificationEmail(email: string, providedOtp?: string) {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new Error('User not found');

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
            template: 'signup-confirmation',
            from,
            context: {
                otp,
                fromName: name,
            },
        });

        return true;
    }

    /**
     * Send password reset OTP. Valid for 5 minutes.
     * Respects per-user anti-spam limits (max 5 per hour).
     * OTP is hashed before storage for security.
     */
    async sendPasswordResetEmail(email: string, providedOtp?: string) {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new Error('User not found');

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
            template: 'reset-password',
            from,
            context: {
                otp,
                fromName: name,
            },
        });

        return true;
    }

    /**
     * Send a simple information email using the info-message template.
     */
    async sendInfoEmail(email: string, title: string, message: string) {
        const normalized = email.toLowerCase();
        const { from, name } = this.getFromAddress();

        await this.mailer.sendMail({
            to: normalized,
            subject: title,
            template: 'info-message',
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
     * Send a custom template email to a user.
     * Template file must exist in templates/ directory.
     * Template receives only fromName in context.
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
     * Update user password after successful OTP verification.
     */
    async updatePassword(email: string, newPassword: string): Promise<boolean> {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new Error('User not found');

        user.password = newPassword;
        await user.save();
        return true;
    }

    /**
     * Verify a previously issued signup OTP. Throws if invalid/expired.
     * Implements brute-force protection with attempt counter.
     * OTP is single-use and invalidated after successful verification.
     */
    async verifySignupOtp(email: string, otp: string) {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new Error('User not found');

        if (!user.emailVerificationCode || !user.emailVerificationExpires) {
            throw new Error('No verification code set');
        }

        // Check expiration first
        const now = new Date();
        if (now.getTime() > user.emailVerificationExpires.getTime()) {
            // Clear expired OTP
            user.emailVerificationCode = null;
            user.emailVerificationExpires = null;
            user.emailVerificationAttempts = 0;
            await user.save();
            throw new Error('OTP expired');
        }

        // Check brute-force protection
        if (user.emailVerificationAttempts >= this.MAX_VERIFICATION_ATTEMPTS) {
            // Invalidate OTP after too many attempts
            user.emailVerificationCode = null;
            user.emailVerificationExpires = null;
            user.emailVerificationAttempts = 0;
            await user.save();
            throw new Error('Too many verification attempts. Please request a new code.');
        }

        // Verify OTP using constant-time comparison
        const isValid = await this.verifyOtp(otp, user.emailVerificationCode);
        
        if (!isValid) {
            // Increment failed attempts counter
            user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
            await user.save();
            throw new Error('Invalid OTP');
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
     * Verify a password reset OTP. Throws on invalid/expired.
     * Implements brute-force protection with attempt counter.
     * OTP is single-use and invalidated after successful verification.
     */
    async verifyPasswordResetOtp(email: string, otp: string) {
        const normalized = email.toLowerCase();
        const user = await this.userModel.findOne({ email: normalized });
        if (!user) throw new Error('User not found');

        if (!user.passwordResetCode || !user.passwordResetExpires) {
            throw new Error('No password reset code set');
        }

        // Check expiration first
        const now = new Date();
        if (now.getTime() > user.passwordResetExpires.getTime()) {
            // Clear expired OTP
            user.passwordResetCode = null;
            user.passwordResetExpires = null;
            user.passwordResetAttempts = 0;
            await user.save();
            throw new Error('OTP expired');
        }

        // Check brute-force protection
        if (user.passwordResetAttempts >= this.MAX_VERIFICATION_ATTEMPTS) {
            // Invalidate OTP after too many attempts
            user.passwordResetCode = null;
            user.passwordResetExpires = null;
            user.passwordResetAttempts = 0;
            await user.save();
            throw new Error('Too many verification attempts. Please request a new code.');
        }

        // Verify OTP using constant-time comparison
        const isValid = await this.verifyOtp(otp, user.passwordResetCode);
        
        if (!isValid) {
            // Increment failed attempts counter
            user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
            await user.save();
            throw new Error('Invalid OTP');
        }

        // Success: Clear OTP (single-use) but keep user object for password update
        user.passwordResetCode = null;
        user.passwordResetExpires = null;
        user.passwordResetAttempts = 0;
        await user.save();

        return user;
    }
}
