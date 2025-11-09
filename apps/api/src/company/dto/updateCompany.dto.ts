import { IsOptional, IsString, IsEmail, IsEnum, IsBoolean, IsStrongPassword, Matches } from 'class-validator';
import { StructureType, LegalStatus } from '../company.schema';
import { NafCode } from '../naf-codes.enum';

/**
 * Data Transfer Object for updating an existing company
 * All fields are optional, allowing partial updates
 */
export class UpdateCompanyDto {
    /** Email address of the company (must be valid email format if provided) */
    @IsOptional()
    @IsEmail()
    email?: string;

    /** Password (must be at least 8 characters with uppercase, lowercase, number, and symbol if provided) */
    @IsOptional()
    @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 })
    password?: string;

    /** Name of the company */
    @IsOptional()
    @IsString()
    name?: string;

    /** SIRET number (French business registration number - exactly 14 digits) */
    @IsOptional()
    @Matches(/^\d{14}$/, { message: 'siretNumber must be exactly 14 digits' })
    siretNumber?: string;

    /** NAF code (French business activity code) */
    @IsOptional()
    @IsEnum(NafCode)
    nafCode?: NafCode;

    /** Type of organizational structure */
    @IsOptional()
    @IsEnum(StructureType)
    structureType?: StructureType;

    /** Legal status of the company */
    @IsOptional()
    @IsEnum(LegalStatus)
    legalStatus?: LegalStatus;

    /** Street number of the company address */
    @IsOptional()
    @IsString()
    streetNumber?: string;

    /** Street name of the company address */
    @IsOptional()
    @IsString()
    streetName?: string;

    /** Postal code of the company address */
    @IsOptional()
    @IsString()
    postalCode?: string;

    /** City of the company address */
    @IsOptional()
    @IsString()
    city?: string;

    /** Country of the company address */
    @IsOptional()
    @IsString()
    country?: string;

    /** Whether the company account is validated */
    @IsOptional()
    @IsBoolean()
    isValid?: boolean;

    /**
     * Constructs an UpdateCompanyDto instance
     * @param partial Partial company data to initialize the DTO
     */
    constructor(partial: Partial<UpdateCompanyDto>) {
        Object.assign(this, partial);
    }
}
