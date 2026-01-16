import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '../reportReason.enum';

export class CreateReportDto {
    @IsMongoId()
    messageId: string;

    @IsEnum(ReportReason)
    reason: ReportReason;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    explanation?: string;
}
