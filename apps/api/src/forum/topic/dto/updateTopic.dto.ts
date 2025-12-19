import { IsArray, ArrayNotEmpty, ArrayUnique, IsMongoId } from 'class-validator';

export class UpdateTopicDto {
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsMongoId({ each: true })
    messages: string[];
}
