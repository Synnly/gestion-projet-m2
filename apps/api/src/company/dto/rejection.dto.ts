import { IsBoolean, IsOptional, IsString } from "class-validator";

/**
 * DTO representing the rejected status structure
 */
export class RejectedDto {
    /**
     * Indicates if the company is rejected
     */
    @IsOptional()
    @IsBoolean()
    isRejected: boolean;

    /**
     * Optional reason for rejection
     */
    @IsOptional()
    @IsString()
    rejectionReason?: string;

    /**
     * Date when the company was rejected
     */
    @IsOptional()
    rejectedAt?: Date;
}