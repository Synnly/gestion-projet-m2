import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

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
