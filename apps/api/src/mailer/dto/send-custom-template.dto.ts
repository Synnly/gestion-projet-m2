import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for sending custom template emails (authenticated users only)
 */
export class SendCustomTemplateDto {
    @IsString()
    @IsNotEmpty({ message: 'Template name is required' })
    templateName: string;
}
