import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { CompanyDto } from 'src/company/dto/company.dto';
import { StudentDto } from 'src/student/dto/student.dto';
import { Types } from 'mongoose';
import { MessageDocument } from '../message.schema';
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
}

