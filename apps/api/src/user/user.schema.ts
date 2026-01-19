import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/roles/roles.enum';
import { Company } from '../company/company.schema';
import { Student } from '../student/student.schema';
import { Admin } from '../admin/admin.schema';

/**
 * Mongoose document type for Ban object
 * Is used only for banned user
 */
@Schema()
export class BanInfo {
    @Prop({ required: true })
    date: Date;

    @Prop({ required: true })
    reason: string;
}
export const BanInfoSchema = SchemaFactory.createForClass(BanInfo);

/**
 * Mongoose document type for User entities
 * Combines the User class with Mongoose Document functionality
 */
export type UserDocument = User & Document;

/**
 * Combined document type for Company users
 *
 * Merges User base fields with Company-specific fields due to discriminator pattern.
 * Used for type-safe access to both user authentication fields and company data.
 *
 * @see {@link User} for base user fields
 * @see {@link Company} for company-specific fields
 */
export type CompanyUserDocument = UserDocument & Company & Document;

/**
 * Combined document type for Student users
 *
 * Merges User base fields with Student-specific fields due to discriminator pattern.
 */
export type StudentUserDocument = UserDocument & Student & Document;

/**
 * Combined document type for Admin users
 *
 * Merges User base fields with Admin-specific fields due to discriminator pattern.
 */
export type AdminUserDocument = UserDocument & Admin & Document;

/**
 * Base User schema for the authentication system
 *
 * Implements Mongoose discriminator pattern where different user types (Company, Admin, Student)
 * share common authentication fields but can have type-specific additional fields.
 *
 * **Discriminator Pattern:**
 * - Discriminator Key: `role`
 * - Base Schema: User (email, password, authentication fields)
 * - Child Schemas: Company (adds business-specific fields)
 *
 * **Security Features:**
 * - Automatic password hashing via pre-save hook
 * - Email stored in lowercase for consistency
 * - Unique email constraint
 * - Password comparison method for authentication
 *
 * **Immutable Fields After Creation:**
 * - Email (set during registration, cannot be changed)
 *
 * @see {@link Company} for the Company discriminator schema
 */
@Schema({ discriminatorKey: 'role', timestamps: true })
export class User {
    /**
     * Unique MongoDB identifier for the user
     */
    _id: Types.ObjectId;

    /**
     * User's email address
     *
     * - Must be unique across all users
     * - Automatically converted to lowercase for case-insensitive lookups
     * - Cannot be modified after account creation
     * - Used as primary identifier for authentication
     */
    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    /**
     * User's hashed password
     *
     * - Stored as bcrypt hash (never plain text)
     * - Automatically hashed via pre-save hook when modified
     * - Minimum requirements enforced by DTOs (8 chars, uppercase, lowercase, number, symbol)
     */
    @Prop({ required: true })
    password: string;

    /**
     * Indicates if the user's email has been verified
     *
     * - Defaults to false for new accounts
     * - Set to true upon successful email verification
     */
    @Prop({ default: false })
    isVerified: boolean;

    /**
     * Validation status of the user account
     *
     * - Defaults to false for new accounts
     * - Set to true after admin verification process
     * - May be required for accessing certain platform features
     */
    @Prop({ default: false })
    isValid: boolean;

    /**
     * One-time verification code sent to user's email for account confirmation
     * - Stores the 6-digit numeric OTP as a string
     * - Cleared when verification completes or expires
     */
    @Prop({ default: null, type: String })
    emailVerificationCode: string | null;

    /**
     * Expiration date for the email verification code
     */
    @Prop({ default: null, type: Date })
    emailVerificationExpires: Date | null;

    /**
     * One-time code for password reset flows
     */
    @Prop({ default: null, type: String })
    passwordResetCode: string | null;

    /**
     * Expiration date for the password reset code
     */
    @Prop({ default: null, type: Date })
    passwordResetExpires: Date | null;

    /**
     * Number of OTP requests in the current rolling window (used by rate limiter)
     * Defaults to 0 and increments on each OTP send request
     */
    @Prop({ default: 0 })
    otpRequestCount: number;

    /**
     * Timestamp of the last OTP request. Used to compute rate-limit windows.
     */
    @Prop({ default: null, type: Date })
    lastOtpRequestAt: Date | null;

    /**
     * Number of failed OTP verification attempts for email verification
     * Reset when a new OTP is generated or after successful verification
     */
    @Prop({ default: 0 })
    emailVerificationAttempts: number;

    /**
     * Number of failed OTP verification attempts for password reset
     * Reset when a new OTP is generated or after successful verification
     */
    @Prop({ default: 0 })
    passwordResetAttempts: number;

    /**
     * Timestamp when the password reset OTP was successfully verified
     * Used to ensure password reset endpoint can only be called after OTP verification
     */
    @Prop({ default: null, type: Date })
    passwordResetValidatedAt: Date | null;

    /**
     * Expiration date for the password reset validation window
     * Typically 5 minutes after OTP verification to complete password reset
     */
    @Prop({ default: null, type: Date })
    passwordResetValidatedExpires: Date | null;

    /**
     * User's role in the system
     *
     * - Serves as discriminator key for Mongoose schema inheritance
     * - Determines user permissions and available features
     * - Possible values: ADMIN, COMPANY, STUDENT
     *
     * @see {@link Role} enum for available roles
     */
    @Prop({ required: true, type: String, enum: Role })
    role: Role;

    /**
     * User's ban info
     * Is only filled if the user has been banned by an admin.
     */
    @Prop({ type: BanInfoSchema })
    ban: BanInfo;
}

export const UserSchema = SchemaFactory.createForClass(User);

/**
 * Pre-save hook for automatic password hashing
 *
 * Intercepts save operations to hash passwords before storage, ensuring passwords
 * are never stored in plain text. Uses bcrypt with salt rounds of 10.
 *
 * **Behavior:**
 * - Only processes password if it has been modified
 * - Skips hashing if password field is undefined (for partial updates)
 * - Uses bcrypt.genSalt(10) for salt generation
 * - Replaces plain text password with hash in the document
 *
 * **When it triggers:**
 * - New user creation (password is new)
 * - Password update via save() method
 * - Does NOT trigger with findOneAndUpdate() or updateOne()
 *
 * @remarks
 * This is why the update method uses findOne + save instead of findOneAndUpdate
 *
 * @throws Passes any bcrypt errors to the next middleware
 */
UserSchema.pre(['save'], async function (next) {
    // Skip if password hasn't been modified
    if (!this.isModified('password')) {
        return next();
    }

    // Safety check: verify password exists and is not empty or whitespace before attempting to hash
    if (!this.password || this.password.trim().length === 0) {
        return next(new Error('Password cannot be empty'));
    }

    try {
        // Generate salt with 10 rounds (good balance of security and performance)
        const salt = await bcrypt.genSalt(10);
        // Hash the password and replace it in the document
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});
