import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Company schema
export enum StructureType {
    Administration = 'Administration',
    Association = 'Association',
    PrivateCompany = 'Private company',
    PublicCompanyOrSEM = 'Public company / SEM',
    MutualCooperative = 'Mutual cooperative',
    NGO = 'NGO',
}

export enum LegalStatus {
    EURL = 'EURL',
    SARL = 'SARL',
    SA = 'SA',
    SAS = 'SAS',
    SNC = 'SNC',
    SCP = 'SCP',
    SASU = 'SASU',
    OTHER = 'Other',
}

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
    _id: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: false, trim: true })
    siretNumber?: string;

    @Prop({ required: false, trim: true })
    nafCode?: string;

    @Prop({ required: false, enum: StructureType })
    structureType?: StructureType;

    @Prop({ required: false, enum: LegalStatus })
    legalStatus?: LegalStatus;

    @Prop({ required: false, trim: true })
    streetNumber?: string;

    @Prop({ required: false, trim: true })
    streetName?: string;

    @Prop({ required: false, trim: true })
    postalCode?: string;

    @Prop({ required: false, trim: true })
    city?: string;

    @Prop({ required: false, trim: true })
    country?: string;

    @Prop({ default: false })
    isValid?: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
