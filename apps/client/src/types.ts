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
    isValid: boolean;

    isVerified: boolean;
    /** Logo URL or path for the company */
    logo?: string;

    /** Rejection status of the company account */
    rejected?: {
        isRejected: boolean;
        rejectionReason?: string;
        rejectedAt?: string;
        modifiedAt?: string;
    };

    /** Date when the profile was last updated */
    updatedAt?: string;
};
