import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { CompanyDto } from 'src/company/dto/company.dto';
import { StudentDto } from 'src/student/dto/student.dto';
import { Types } from 'mongoose';
import { Message, MessageDocument } from '../message.schema';
import { User } from 'src/user/user.schema';
import { Role } from 'src/common/roles/roles.enum';
@Exclude()
export class MessageDto {
    /**
     * Unique identifier of the message
     */

    @Transform(({ obj }: { obj: MessageDocument }) => obj._id)
    @Expose()
    _id: Types.ObjectId;

    /**
     * ID of the author of the message
     */
    @Expose()
    @Type((opts) => {
        const obj = opts?.newObject as User;
        if (obj.role === Role.STUDENT) return StudentDto;
        if (obj.role === Role.COMPANY) return CompanyDto;
        return Object; // Fallback
    })
    @ValidateNested()
    author: StudentDto | CompanyDto;

    /**
     * Content of the message
     */
    @Expose()
    @IsString()
    content: string;
    /**
     * Optional ID of the message being replied to
     */
    @Expose()
    @IsOptional()
    @IsString()
    @Type(() => MessageDto)
    parentMessage?: MessageDto;

    @Expose()
    @Transform(({ obj }: { obj: Message }) => obj.createdAt)
    createdAt: Date;
}
