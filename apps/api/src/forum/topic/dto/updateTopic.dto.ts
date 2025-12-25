import { IsArray, ArrayUnique, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

/**
 * DTO for updating a topic in the forum.
 */
export class UpdateTopicDto {
    /**
     * List of message IDs associated with the topic.
     */
    @IsArray()
    @ArrayUnique()
    @IsMongoId({ each: true })
    messages: Types.ObjectId[];
}
