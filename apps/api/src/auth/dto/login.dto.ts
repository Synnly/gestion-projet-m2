import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '../../common/roles/roles.enum';

export class LoginDto {
    /** Email address of the user */
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    /** Password of the user */
    @IsString()
    @IsNotEmpty()
    password: string;

    /** Role of the user */
    @IsEnum(Role)
    @IsNotEmpty()
    role: Role;
}
