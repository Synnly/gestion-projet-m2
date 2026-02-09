import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for initiating a database import.
 */
export class CreateImportDto {
    /** Whether to clear existing data before importing (defaults to false for safety) */
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (typeof value === 'boolean') return value;
        return value; // Return unchanged for validation to catch invalid values
    })
    @IsBoolean()
    clearExisting?: boolean = false;
}
