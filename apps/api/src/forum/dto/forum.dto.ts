import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { ValidateNested } from 'class-validator';
import { CompanyDto } from '../../company/dto/company.dto';

@Exclude()
export class ForumDto {
    /**
     * Unique identifier of the forum
     */
    @Transform((params) => params.obj._id)
    @Expose()
    _id: Types.ObjectId;

    /**
     * Reference to the company owning the forum. If nullish, the forum is the general forum.
     */
    @Expose()
    @ValidateNested({ each: true })
    @Type(() => CompanyDto)
    company?: CompanyDto;

    // @Expose()
    // @ValidateNested({ each: true })
    // @Type(() => TopicDto)
    // topics: TopicDto[];

    /**
     * Number of topics in the forum
     */
    @Expose()
    nbTopics: number;

    /**
     * Number of messages in the forum
     */
    @Expose()
    nbMessages: number;
}
