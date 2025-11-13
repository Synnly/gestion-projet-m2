import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/roles/roles.enum';
import { Company } from '../company/company.schema';

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
     * Email verification status
     * 
     * - Defaults to false for new accounts
     * - Set to true after email verification process
     * - May be required for accessing certain platform features
     */
    @Prop({ default: false })
    isVerified: boolean;

    /**
     * Token used for email verification
     * 
     * - Generated during registration
     * - Sent to user's email for account activation
     * - Optional field, only present during verification process
     */
    @Prop()
    validationToken?: string;

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
UserSchema.pre('save', async function (next) {
    // Skip if password hasn't been modified
    if (!this.isModified('password')) {
        return next();
    }

    // Safety check: verify password exists before attempting to hash
    if (!this.password) {
        return next();
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

/**
 * Instance method to verify a password against the stored hash
 * 
 * Used during authentication to validate user credentials. Compares the provided
 * plain-text password with the hashed password stored in the database using bcrypt.
 * 
 * @param candidatePassword - The plain-text password to verify (from login attempt)
 * @returns Promise resolving to true if password matches, false otherwise
 * 
 * @example
 * ```typescript
 * const user = await userModel.findOne({ email: 'user@example.com' });
 * const isValid = await user.comparePassword('userInputPassword');
 * if (isValid) {
 *   // Authentication successful
 * }
 * ```
 * 
 * @remarks
 * This method is added to all User documents and is available on discriminator
 * schemas (Company, Admin, Student) as well.
 */
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};
