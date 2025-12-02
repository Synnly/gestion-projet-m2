import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
    /** Extension of the CV file being uploaded */
    @IsString()
    @IsEnum(['pdf', 'doc', 'docx'])
    cvExtension: string;

    /** Extension of the cover letter file being uploaded (optional) */
    @IsOptional()
    @IsString()
    @IsEnum(['pdf', 'doc', 'docx'])
    lmExtension?: string;
}
