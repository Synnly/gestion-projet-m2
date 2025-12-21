import { IsString, IsOptional, IsArray, ArrayUnique, IsMongoId } from 'class-validator';

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
    messages?: string[];

    author?: string;
    forumId?: string;
}
