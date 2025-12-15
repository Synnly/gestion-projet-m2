import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

/**
 * Validate and transform pagination and filter query parameters.
 * Enforces `page >= 1` and `limit` between 1 and 100; converts types via ClassTransformer.
 * Exposes common filter fields consumed by `QueryBuilder` (title, description, sector, etc.).
 * Defaults are conservative to protect the API from abusive requests.
 */
export class PaginationDto {
    /** Requested page number (1-based). Must be an integer >= 1. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    /** Number of items per page. Must be an integer >= 1 and <= 100 to prevent API abuse. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
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
