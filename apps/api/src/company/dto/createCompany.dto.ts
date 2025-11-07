import {
    IsString,
    IsEmail,
    MinLength,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsStrongPassword,
    IsNotEmpty,
} from 'class-validator';
import { StructureType, LegalStatus } from '../company.schema';

export class CreateCompanyDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 })
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    siretNumber?: string;

    @IsOptional()
    @IsString()
    nafCode?: string;

    @IsOptional()
    @IsEnum(StructureType)
    structureType?: StructureType;

    @IsOptional()
    @IsEnum(LegalStatus)
    legalStatus?: LegalStatus;

    @IsOptional()
    @IsString()
    streetNumber?: string;

    @IsOptional()
    @IsString()
    streetName?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsBoolean()
    isValid: boolean;

    constructor(partial: Partial<CreateCompanyDto>) {
        Object.assign(this, partial);
    }
}
