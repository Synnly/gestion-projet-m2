import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for generating presigned upload URLs
 * Used by both logo and CV upload endpoints
 */
export class GeneratePresignedUploadDto {
    /**
     * Original filename provided by the client
     * Will be sanitized and prefixed with timestamp
     */
    @IsString()
    @IsNotEmpty()
    originalFilename: string;
}
