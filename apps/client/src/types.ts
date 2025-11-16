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
    nafCode?: string;

    /** Type of organizational structure */
    structureType?: string;

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
    isValid?: boolean;

    /** Logo URL or path for the company */
    logo?: string;
};
