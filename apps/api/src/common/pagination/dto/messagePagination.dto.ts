import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class MessagePaginationDto {
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
}
