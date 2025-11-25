import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO for pagination query parameters.
 *
 * Validates and transforms `page` and `limit` values typically provided
 * in the request query string. Both values are optional and default to
 * sensible numbers when omitted.
 */
export class PaginationDto {
    /** Requested page number (1-based). Must be an integer >= 1. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    /** Number of items per page. Must be an integer >= 1. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit = 10;

    @IsOptional()
    @Type(() => String)
    @IsString()
    searchQuery?: string;
}
