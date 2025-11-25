import { IsNotEmpty, IsString, Length } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/createUser.dto';

/**
 * DTO for creating a Student
 */
export class CreateStudentDto extends CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    lastName: string;
}
