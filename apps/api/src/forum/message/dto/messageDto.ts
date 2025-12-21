import { Exclude, Expose } from 'class-transformer';
import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { CompanyDto } from 'src/company/dto/company.dto';
import { StudentDto } from 'src/student/dto/student.dto';

@Exclude()
export class MessageDto {
    /**
     * ID of the author of the message
     */
    @Expose()
    @IsMongoId()
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
    parentMessage?: MessageDto;
}
