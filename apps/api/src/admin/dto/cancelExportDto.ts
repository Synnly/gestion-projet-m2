import { IsMongoId } from 'class-validator';

/**
 * DTO for cancelling a database export operation.
 */
export class CancelExportDto {
    @IsMongoId()
    exportId: string;
}
