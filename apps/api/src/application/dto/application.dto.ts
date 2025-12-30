import { Types } from 'mongoose';
import { ApplicationStatus } from '../application.schema';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { PostDto } from '../../post/dto/post.dto';
import { ValidateNested } from 'class-validator';
import { StudentDto } from '../../student/dto/student.dto';

@Exclude()
export class ApplicationDto {
    /** Unique MongoDB identifier */
    @Transform((params) => params.obj._id)
    @Expose()
    _id: Types.ObjectId;

    /** Reference to the post for which the application is sent */
    @Expose()
    @ValidateNested({ each: true })
    @Type(() => PostDto)
    post: PostDto;

    /** Reference to the student who sent the application */
    @Expose()
    @ValidateNested({ each: true })
    @Type(() => StudentDto)
    student: StudentDto;

    /** Status of the application */
    @Expose()
    status: ApplicationStatus;

    /** The url or path to the resume submitted with the application */
    @Expose()
    cv: string;

    /** The url or path to the cover letter submitted with the application */
    @Expose()
    coverLetter?: string;

    /**
     * Timestamp when the application was created
     */
    @Expose()
    createdAt: string;

    /**
     * Constructor to create an ApplicationDto instance
     * @param application Partial application data to initialize the DTO
     */
    constructor(application?: Partial<ApplicationDto>) {
        Object.assign(this, application);
    }
}

@Exclude()
export class ApplicationPaginationDto {
    @Expose()
    @ValidateNested({ each: true })
    @Type(() => ApplicationDto)
    data: ApplicationDto[];

    @Expose()
    total: number;

    @Expose()
    page: number;

    @Expose()
    limit: number;
}
