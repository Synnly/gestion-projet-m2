import {
    IsOptional,
    IsString,
    IsEmail,
    MinLength,
    IsEnum,
    IsBoolean,
    IsStrongPassword,
    IsNotEmpty,
} from 'class-validator';
import { StructureType, LegalStatus } from '../company.schema';

export class UpdateCompanyDto {
    @IsOptional()
    @IsEmail()
    @IsNotEmpty()
    email?: string;

    @IsOptional()
    @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 })
    @IsNotEmpty()
    password?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    siretNumber?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    nafCode?: string;

    @IsOptional()
    @IsEnum(StructureType)
    @IsNotEmpty()
    structureType?: StructureType;

    @IsOptional()
    @IsEnum(LegalStatus)
    @IsNotEmpty()
    legalStatus?: LegalStatus;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    streetNumber?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    streetName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    postalCode?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    city?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    country?: string;

    @IsOptional()
    @IsBoolean()
    isValid?: boolean;

    constructor(partial: Partial<UpdateCompanyDto>) {
        Object.assign(this, partial);
    }
}
