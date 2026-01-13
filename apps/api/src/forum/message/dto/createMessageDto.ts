import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
    /**
     * ID of the author of the message
     */
    @IsMongoId()
    authorId: string;
    /**
     * Content of the message
     */
    @IsString()
    content: string;
    /**
     * Optional ID of the message being replied to
     */
    @IsOptional()
    @IsMongoId()
    parentMessageId?: string;
}
