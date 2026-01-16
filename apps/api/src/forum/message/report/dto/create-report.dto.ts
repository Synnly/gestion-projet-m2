import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '../report.schema';

/**
 * DTO for creating a new report.
 */
export class CreateReportDto {
    /**
     * The ID of the message being reported.
     */
    @IsMongoId({ message: "L'ID du message doit être un ObjectId MongoDB valide" })
    messageId: string;

    /**
     * The reason for reporting the message.
     */
    @IsEnum(ReportReason, { message: 'La raison du signalement doit être une valeur valide' })
    reason: ReportReason;

    /**
     * Optional explanation for the report.
     */
    @IsOptional()
    @IsString({ message: "L'explication doit être une chaîne de caractères" })
    @MaxLength(1000, { message: "L'explication ne peut pas dépasser 1000 caractères" })
    explanation?: string;
}
