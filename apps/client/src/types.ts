import type { NafCode, StructureType } from './company/completeProfil/type';

export type companyProfile = {
    /** Unique identifier of the company */
    _id: string;

    /** Email address of the company */
    email: string;

    /** Name of the company */
    name: string;

    /** SIRET number (French business registration number) */
    siretNumber?: string;

    /** NAF code (French business activity code) */
    nafCode: NafCode | undefined;

    /** Type of organizational structure */
    structureType: StructureType | undefined;

    /** Legal status of the company */
    legalStatus?: string;

    /** adress of the company */
    address: string;

    /** Whether the company account is validated */
    isValid: boolean;

    isVerified: boolean;
    /** Logo URL or path for the company */
    logo?: string;
};
