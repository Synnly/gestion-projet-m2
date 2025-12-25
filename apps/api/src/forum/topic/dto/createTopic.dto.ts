import { IsString, IsOptional, IsArray, ArrayUnique, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

/**
 * DTO for creating a new topic in the forum.
 */
export class CreateTopicDto {
    /**
     * Title of the topic.
     * Required.
     */
    @IsString()
    @IsNotEmpty()
    title: string;

    /**
     * Description of the topic.
     * Optional.
     */
    @IsOptional()
    @IsString()
    description?: string;

    /**
     * get by token and set in the controller
     */
    author?: Types.ObjectId;
}
