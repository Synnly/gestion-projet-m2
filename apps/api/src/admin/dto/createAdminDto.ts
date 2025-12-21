import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

/**
 * DTO for creating an Admin
 */
export class CreateAdminDto {
    /**
     * Admin's email address
     *
     * - Must be a valid email format
     * - Will be automatically converted to lowercase
     * - Cannot be modified after account creation
     * - Used as primary identifier for authentication
     */
    @IsNotEmpty()
    @IsEmail()
    email: string;

    /**
     * Admin's password
     *
     * - Must be at least 32 characters long for security
     */
    @IsNotEmpty()
    @MinLength(32)
    password: string;

    constructor(partial: Partial<CreateAdminDto>) {
        Object.assign(this, partial);
    }
}
