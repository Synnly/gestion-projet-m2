import { IsArray, ArrayUnique, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateTopicDto {
    @IsArray()
    @ArrayUnique()
    @IsMongoId({ each: true })
    messages: Types.ObjectId[];
}
