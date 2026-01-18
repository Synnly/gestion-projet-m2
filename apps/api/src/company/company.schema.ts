import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NafCode } from './nafCodes.enum';
import { Post } from '../post/post.schema';

/**
 * Enumeration of organizational structure types
 * Defines the different types of organizations that can register as companies
 */
export enum StructureType {
    /** Government or public administration entity */
    Administration = 'Administration',
    /** Non-profit association */
    Association = 'Association',
    /** Private sector company */
    PrivateCompany = 'Private company',
    /** Public company or mixed economy company (Société d'Économie Mixte) */
    PublicCompanyOrSEM = 'Public company / SEM',
    /** Mutual or cooperative organization */
    MutualCooperative = 'Mutual cooperative',
    /** Non-Governmental Organization */
    NGO = 'NGO',
}

/**
 * Enumeration of legal statuses for companies in France
 * Defines the different legal forms a company can take
 */
export enum LegalStatus {
    /** Entreprise Unipersonnelle à Responsabilité Limitée (Single-person limited liability company) */
    EURL = 'EURL',
    /** Société à Responsabilité Limitée (Limited liability company) */
    SARL = 'SARL',
    /** Société Anonyme (Public limited company) */
    SA = 'SA',
    /** Société par Actions Simplifiée (Simplified joint-stock company) */
    SAS = 'SAS',
    /** Société en Nom Collectif (General partnership) */
    SNC = 'SNC',
    /** Société Civile Professionnelle (Professional civil company) */
    SCP = 'SCP',
    /** Société par Actions Simplifiée Unipersonnelle (Single-person simplified joint-stock company) */
    SASU = 'SASU',
    /** Other legal status not listed above */
    OTHER = 'Other',
}

/**
 * Type combining Company schema with Mongoose Document
 * Used for type safety when working with Mongoose models
 */
export type CompanyDocument = Company & Document;

/**
 * MongoDB schema for Company entities
 * Stores information about companies registered in the system
 * Includes automatic timestamps (createdAt, updatedAt)
 */
@Schema({ timestamps: true })
export class Company {
    /** Unique MongoDB identifier */
    _id: Types.ObjectId;

    /** Name of the company (trimmed whitespace) */
    @Prop({ required: true, trim: true })
    name: string;

    /** SIRET number - French business registration number (14 digits) */
    @Prop({ required: false, trim: true })
    siretNumber?: string;

    /** NAF code - French business activity code (Nomenclature d'Activités Française) */
    @Prop({ required: false, type: String, enum: NafCode })
    nafCode?: NafCode;

    /** Type of organizational structure */
    @Prop({ required: false, enum: StructureType })
    structureType?: StructureType;

    /** Legal status of the company */
    @Prop({ required: false, enum: LegalStatus })
    legalStatus?: LegalStatus;

    /** Physical address of the company */
    @Prop({ required: false, trim: true })
    address: string;

    /** Optional logo URL or path for the company */
    @Prop({ required: false, trim: true })
    logo?: string;

    /** Whether the company account has been validated by an administrator */
    @Prop({ default: false })
    isValid?: boolean;

    /** Date when the company was soft-deleted (for soft-delete functionality) */
    @Prop({ required: false })
    deletedAt?: Date;

    /** Internships posts associated with the company */
    @Prop({
        type: [{ type: Types.ObjectId, ref: 'Post' }],
        default: [],
    })
    posts: Post[];
}

/**
 * Mongoose schema instance for the Company class
 * Used to create the Company model with all defined properties and validations
 */
export const CompanySchema = SchemaFactory.createForClass(Company);
