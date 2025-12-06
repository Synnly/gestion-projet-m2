import { IsEmail, IsNotEmpty, IsEnum, IsStrongPassword } from 'class-validator';
import { Role } from '../../common/roles/roles.enum';

/**
 * Data Transfer Object for user registration
 *
 * Used when creating new user accounts in the system. All fields are required
 * and will be validated according to their constraints.
 *
 * **Security Considerations:**
 * - Password will be automatically hashed before storage via User schema pre-save hook
 * - Email is stored in lowercase for case-insensitive lookups
 * - Email must be unique across all users
 *
 * **Immutable Fields After Creation:**
 * - Email cannot be changed after account creation
 * - Role cannot be changed after account creation
 *
 * @example
 * ```typescript
 * const createUserDto = new CreateUserDto();
 * createUserDto.email = 'user@example.com';
 * createUserDto.password = 'SecurePass123!';
 * createUserDto.role = Role.COMPANY;
 * ```
 *
 * @see {@link Role} for available user roles
 * @see {@link User} for the base user schema
 */
export class CreateUserDto {
    /**
     * User's email address
     *
     * - Must be a valid email format
     * - Must be unique across all users
     * - Will be automatically converted to lowercase
     * - Cannot be modified after account creation
     * - Used as primary identifier for authentication
     *
     * @example 'user@example.com'
     */
    @IsEmail()
    email: string;

    /**
     * User's password for authentication
     *
     * Must meet strong password requirements:
     * - Minimum 8 characters
     * - At least 1 uppercase letter
     * - At least 1 lowercase letter
     * - At least 1 number
     * - At least 1 special symbol
     *
     * The password will be automatically hashed using bcrypt before storage
     * via the User schema pre-save hook.
     *
     * @example 'MySecureP@ssw0rd!'
     */
    @IsNotEmpty()
    @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 })
    password: string;

    /**
     * User's role in the system
     *
     * Determines the user type and associated permissions:
     * - `ADMIN`: System administrators with full access
     * - `COMPANY`: Company users who can post offers and manage their profile
     * - `STUDENT`: Student users who can apply to offers
     *
     * The role acts as a discriminator key in the User schema, allowing
     * different user types to have type-specific additional fields.
     *
     * @example Role.COMPANY
     *
     * @see {@link Role} for complete role definitions
     */
    @IsEnum(Role)
    role: Role;
}
