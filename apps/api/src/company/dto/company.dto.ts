import { StructureType, LegalStatus, Company } from '../company.schema';

export class CompanyDto {
    _id: string;

    email: string;

    name: string;

    siretNumber?: string;

    nafCode?: string;

    structureType?: StructureType;

    legalStatus?: LegalStatus;

    streetNumber?: string;

    streetName?: string;

    postalCode?: string;

    city?: string;

    country?: string;

    isValid?: boolean;

    constructor(company?: Partial<CompanyDto>) {
        Object.assign(this, company);
    }
}
