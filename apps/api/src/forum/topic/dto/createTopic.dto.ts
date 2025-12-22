import { IsString, IsOptional, IsArray, ArrayUnique, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateTopicDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsMongoId({ each: true })
    messages?: Types.ObjectId[];

    author?: Types.ObjectId;
}
