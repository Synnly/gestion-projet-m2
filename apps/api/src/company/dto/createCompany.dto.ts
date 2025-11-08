import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsStrongPassword,
    IsNotEmpty,
} from 'class-validator';
import { StructureType, LegalStatus } from '../company.schema';

/**
 * Data Transfer Object for creating a new company
 * Contains all required and optional fields with validation rules
 */
export class CreateCompanyDto {
    /** Email address of the company (must be valid email format) */
    @IsEmail()
    @IsNotEmpty()
    email: string;

    /** Password (must be at least 8 characters with uppercase, lowercase, number, and symbol) */
    @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 })
    @IsNotEmpty()
    password: string;

    /** Name of the company */
    @IsString()
    @IsNotEmpty()
    name: string;

    /** SIRET number (French business registration number) */
    @IsOptional()
    @IsString()
    siretNumber?: string;

    /** NAF code (French business activity code) */
    @IsOptional()
    @IsString()
    nafCode?: string;

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

    /** Whether the company account should be validated */
    @IsBoolean()
    isValid: boolean;

    /**
     * Constructs a CreateCompanyDto instance
     * @param partial Partial company data to initialize the DTO
     */
    constructor(partial: Partial<CreateCompanyDto>) {
        Object.assign(this, partial);
    }
}
