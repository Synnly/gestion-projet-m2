import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ExportFormat {
    JSON = 'json',
}

/**
 * DTO for initiating a database export.
 */
export class CreateExportDto {

    @IsOptional()
    @IsEnum(ExportFormat)
    format?: ExportFormat = ExportFormat.JSON;
}
