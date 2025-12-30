import { IsOptional, IsString, IsEmail, IsUrl } from 'class-validator';

/**
 * DTO for updating the public company profile
 * These fields are editable by the company and visible to students
 */
export class UpdateCompanyPublicProfileDto {
    /**
     * Company public description
     */
    @IsOptional()
    @IsString()
    description?: string;

    /**
     * Public contact email for students
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
     * Company website URL
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

    constructor(partial: Partial<UpdateCompanyPublicProfileDto>) {
        Object.assign(this, partial);
    }
}
