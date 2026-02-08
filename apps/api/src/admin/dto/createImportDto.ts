import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for initiating a database import.
 */
export class CreateImportDto {
    /** Whether to clear existing data before importing (defaults to false for safety) */
    @IsOptional()
    @IsBoolean()
    clearExisting?: boolean = false;
}
