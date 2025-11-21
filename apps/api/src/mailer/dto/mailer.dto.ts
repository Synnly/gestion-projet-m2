import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length } from 'class-validator';

/**
 * Base DTO for email operations
 * Used for: forgot password, send verification
 */
export class EmailDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;
}

/**
 * DTO for OTP verification
 * Used for: verify account, verify password reset OTP
 */
export class VerifyOtpDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'OTP is required' })
    @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
    otp: string;
}

/**
 * DTO for resetting password with OTP
 */
export class ResetPasswordDto extends VerifyOtpDto {
    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    @IsStrongPassword(
        { minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
        {
            message: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 symbol',
        },
    )
    newPassword: string;
}
