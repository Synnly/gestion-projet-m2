import type { NafCode, StructureType } from './CompleteProfil.types';

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

    /** Public company description */
    description?: string;

    /** Public contact phone number */
    telephone?: string;

    /** Public company website */
    website?: string;

    /** Public contact email for students */
    emailContact?: string;

    /** Rejection status of the company account */
    rejected?: {
        isRejected: boolean;
        rejectionReason?: string;
        rejectedAt?: string;
        modifiedAt?: string;
    };

    /** Date when the profile was last updated */
    updatedAt?: string;

    /** Date when the profile was deleted */
    deletedAt?: string;
};
