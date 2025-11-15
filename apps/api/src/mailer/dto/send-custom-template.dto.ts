import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for sending custom template emails (authenticated users only)
 */
export class SendCustomTemplateDto {
    @IsString()
    @IsNotEmpty({ message: 'Template name is required' })
    @MaxLength(50)
    templateName: string;
}
