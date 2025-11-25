import { IsOptional, IsString, IsStrongPassword, Length } from 'class-validator';

/**
 * DTO for updating a Student.
 *
 * All fields are optional for partial updates.
 */
export class UpdateStudentDto {
    @IsOptional()
    @IsString()
    @Length(1, 50)
    firstName?: string;

    @IsOptional()
    @IsString()
    @Length(1, 50)
    lastName?: string;

    @IsOptional()
    @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 })
    password?: string;
}
