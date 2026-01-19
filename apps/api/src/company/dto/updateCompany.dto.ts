import { IsOptional, IsString, IsEnum, IsBoolean, IsStrongPassword, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StructureType, LegalStatus, type RejectionStatus } from '../company.schema';
import { NafCode } from '../nafCodes.enum';
import { RejectedDto } from './rejection.dto';

/**
 * Data Transfer Object for updating an existing company
 *
 * All fields are optional, allowing partial updates of company information.
 *
 * **Important immutable fields:**
 * - Email: Cannot be modified after company creation (not included in this DTO)
 * - SIRET number: Cannot be modified after company creation (not included in this DTO)
 *
 * These restrictions ensure data integrity and compliance with business rules.
 *
 * @example
 * ```typescript
 * const updateDto = new UpdateCompanyDto({
 *   name: 'New Company Name',
 *   city: 'Paris'
 * });
 * ```
 */
export class UpdateCompanyDto {
    /**
     * New password for the company account
     * Must meet strong password requirements: minimum 8 characters with at least
     * one uppercase letter, one lowercase letter, one number, and one symbol
     * Password will be automatically hashed before storage via User schema pre-save hook
     */
    @IsOptional()
    @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 })
    password?: string;

    /**
     * Company name
     * Can be updated to reflect name changes, rebranding, etc.
     */
    @IsOptional()
    @IsString()
    name?: string;

    /**
     * NAF code (French business activity code - Nomenclature des Activités Françaises)
     * Classifies the main business activity of the company
     * Must be a valid code from the NafCode enum
     */
    @IsOptional()
    @IsEnum(NafCode)
    nafCode?: NafCode;

    /**
     * Type of organizational structure
     * Defines whether the company is a private company, association, NGO, etc.
     */
    @IsOptional()
    @IsEnum(StructureType)
    structureType?: StructureType;

    /**
     * Legal status of the company
     * Specifies the legal form (SAS, SARL, EURL, etc.) under French law
     */
    @IsOptional()
    @IsEnum(LegalStatus)
    legalStatus?: LegalStatus;

    @IsOptional()
    @IsString()
    address?: string;

    /**
     * Account validation status
     * Set to true when the company account has been verified and approved by administrators
     * Controls whether the company can access full platform features
     */
    @IsOptional()
    @IsBoolean()
    isValid?: boolean;

    /**
     * Logo URL or file path for the company
     * Used for branding and visual identification on the platform
     */
    @IsOptional()
    @IsString()
    logo?: string;

    /**
     * Internship posts associated with the company
     */
    @IsOptional()
    @IsMongoId({ each: true })
    posts?: string[];

    @IsOptional()
    @IsString()
    description?: string;

    /**
     * Rejection status object containing whether the company is rejected
     * and an optional reason string. Used by admin validation endpoints.
     */
    @IsOptional()
    @ValidateNested()
    @Type(() => RejectedDto)
    rejected?: RejectedDto;

    /**
     * Constructs an UpdateCompanyDto instance
     *
     * @param partial - Partial company data to initialize the DTO
     *                  Only provided fields will be set, others remain undefined
     *
     * @example
     * ```typescript
     * const dto = new UpdateCompanyDto({
     *   name: 'Updated Company Name',
     *   city: 'Paris'
     * });
     * // Only name and city will be updated, other fields remain unchanged
     * ```
     */
    constructor(partial: Partial<UpdateCompanyDto>) {
        Object.assign(this, partial);
    }
}
