import type z from 'zod';
import { companyFormSignUpSchema } from './zodSchema';

// Definition of structure types for companies
export const StructureType = {
    /** Government or public administration entity */
    Administration: 'Administration',
    /** Non-profit association */
    Association: 'Association',
    /** Private sector company */
    PrivateCompany: 'Private company',
    /** Public company or mixed economy company (Société d'Économie Mixte) */
    PublicCompanyOrSEM: 'Public company / SEM',
    /** Mutual or cooperative organization */
    MutualCooperative: 'Mutual cooperative',
    /** Non-Governmental Organization */
    NGO: 'NGO',
} as const;
export type StructureType = (typeof StructureType)[keyof typeof StructureType];

// Definition of legal status types for companies
export const LegalStatus = {
    /** Entreprise Unipersonnelle à Responsabilité Limitée (Single-person limited liability company) */
    EURL: 'EURL',
    /** Société à Responsabilité Limitée (Limited liability company) */
    SARL: 'SARL',
    /** Société Anonyme (Public limited company) */
    SA: 'SA',
    /** Société par Actions Simplifiée (Simplified joint-stock company) */
    SAS: 'SAS',
    /** Société en Nom Collectif (General partnership) */
    SNC: 'SNC',
    /** Société Civile Professionnelle (Professional civil company) */
    SCP: 'SCP',
    /** Société par Actions Simplifiée Unipersonnelle (Single-person simplified joint-stock company) */
    SASU: 'SASU',
    /** Other legal status not listed above */
    OTHER: 'Other',
};
export type LegalStatus = (typeof LegalStatus)[keyof typeof LegalStatus];

// Type inferred from Zod schema for company sign-up form
export type companyFormSignUp = z.infer<typeof companyFormSignUpSchema>; // preprocess will transform empty strings to undefined for optional fields
