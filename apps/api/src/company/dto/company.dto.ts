import { StructureType, LegalStatus } from '../company.schema';
import { Types } from 'mongoose';

/**
 * Data Transfer Object for company responses
 * Represents the structure of company data sent to clients
 */
export class CompanyDto {
    /** Unique identifier of the company */
    _id: Types.ObjectId;

    /** Email address of the company */
    email: string;

    /** Name of the company */
    name: string;

    /** SIRET number (French business registration number) */
    siretNumber?: string;

    /** NAF code (French business activity code) */
    nafCode?: string;

    /** Type of organizational structure */
    structureType?: StructureType;

    /** Legal status of the company */
    legalStatus?: LegalStatus;

    /** Street number of the company address */
    streetNumber?: string;

    /** Street name of the company address */
    streetName?: string;

    /** Postal code of the company address */
    postalCode?: string;

    /** City of the company address */
    city?: string;

    /** Country of the company address */
    country?: string;

    /** Whether the company account is validated */
    isValid?: boolean;

    /**
     * Constructs a CompanyDto instance
     * @param company Partial company data to initialize the DTO
     */
    constructor(company?: Partial<CompanyDto>) {
        Object.assign(this, company);
    }
}
