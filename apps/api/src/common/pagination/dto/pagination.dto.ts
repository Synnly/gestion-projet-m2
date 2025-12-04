import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

    @IsOptional()
    @Type(() => String)
    @IsString()
    title?: string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    description?: string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    duration?: string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    sector?: string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    type?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    minSalary?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    maxSalary?: number;

    @IsOptional()
    @Type(() => String)
    @IsString({ each: true })
    keySkills?: string[] | string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    companyName?: string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    city?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    radiusKm?: number;

    @IsOptional()
    @Type(() => String)
    @IsString()
    sort?: string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    company?: string;
}
