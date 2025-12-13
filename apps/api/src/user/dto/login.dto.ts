import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

/**
 * Data Transfer Object for user authentication
 *
 * Used when users attempt to log into the system. Validates credentials
 * before authentication process begins.
 *
 * **Authentication Flow:**
 * 1. User submits LoginDto with email and password
 * 2. System finds user by email
 * 3. Password is compared with stored hash using bcrypt
 * 4. JWT token is issued if credentials are valid
 *
 * **Security Features:**
 * - Email is case-insensitive (stored as lowercase)
 * - Password validation ensures strong password policy
 * - Actual password comparison uses bcrypt.compare()
 * - Failed attempts should be rate-limited at controller level
 *
 * @example
 * ```typescript
 * const loginDto = new LoginDto();
 * loginDto.email = 'user@example.com';
 * loginDto.password = 'MySecureP@ssw0rd!';
 * ```
 *
 * @see {@link User.comparePassword} for password verification method
 */
export class LoginDto {
    /**
     * User's email address for authentication
     *
     * - Must be a valid email format
     * - Case-insensitive (automatically converted to lowercase in database)
     * - Used to lookup the user account
     *
     * @example 'user@example.com'
     */
    @IsEmail()
    email: string;

    /**
     * User's password for authentication
     *
     * This password will be compared with the stored bcrypt hash
     * to authenticate the user.
     *
     * @example 'MySecureP@ssw0rd!'
     */
    @IsNotEmpty()
    password: string;
}
