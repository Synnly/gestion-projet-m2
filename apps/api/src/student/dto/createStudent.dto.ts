import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * DTO for creating a Student
 */
export class CreateStudentDto {
    /**
     * Student's email address
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

    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    studentNumber: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    lastName: string;
}
