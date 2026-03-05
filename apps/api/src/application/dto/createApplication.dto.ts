import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateApplicationDto {
    /** Student identifier associated with the application */
    @IsOptional()
    @IsMongoId()
    @IsString()
    studentId?: string;

    /** Post identifier associated with the application */
    @IsOptional()
    @IsMongoId()
    @IsString()
    postId?: string;

    /** Use student profile default CV instead of uploading a new file */
    @IsOptional()
    @IsBoolean()
    useDefaultCv?: boolean;

    /** Extension of the CV file being uploaded */
    @ValidateIf((dto: CreateApplicationDto) => !dto.useDefaultCv)
    @IsString()
    @IsEnum(['pdf', 'doc', 'docx'])
    cvExtension?: string;

    /** Extension of the cover letter file being uploaded (optional) */
    @IsOptional()
    @IsString()
    @IsEnum(['pdf', 'doc', 'docx'])
    lmExtension?: string;
}
