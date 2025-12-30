import { IsOptional, IsString, IsEmail, IsUrl } from 'class-validator';

/**
 * DTO for displaying a public company profile to students
 * Read-only data, no mutation allowed
 */
export class CompanyPublicDto {
    /**
     * Company name
     */
    @IsString()
    name: string;

    /**
     * Public description of the company
     */
    @IsOptional()
    @IsString()
    description?: string;

    /**
     * Public contact email
     */
    @IsOptional()
    @IsEmail()
    emailContact?: string;

    /**
     * Public phone number
     */
    @IsOptional()
    @IsString()
    telephone?: string;

    /**
     * Company website
     */
    @IsOptional()
    @IsUrl()
    website?: string;

    /**
     * Street number
     */
    @IsOptional()
    @IsString()
    streetNumber?: string;

    /**
     * Street name
     */
    @IsOptional()
    @IsString()
    streetName?: string;

    /**
     * Postal code
     */
    @IsOptional()
    @IsString()
    postalCode?: string;

    /**
     * City
     */
    @IsOptional()
    @IsString()
    city?: string;

    /**
     * Country
     */
    @IsOptional()
    @IsString()
    country?: string;

    /**
     * Company logo (URL or path)
     */
    @IsOptional()
    @IsString()
    logo?: string;
}
