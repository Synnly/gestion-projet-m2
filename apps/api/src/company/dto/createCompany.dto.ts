import { IsString, IsOptional, IsEnum, IsNotEmpty, Matches, Length } from 'class-validator';
import { StructureType, LegalStatus } from '../company.schema';
import { NafCode } from '../nafCodes.enum';
import { CreateUserDto } from '../../user/dto/createUser.dto';

/**
 * Data Transfer Object for creating a new company
 * Extends CreateUserDto to inherit auth fields (email/password)
 * Service must force role = Role.COMPANY when creating
 */
export class CreateCompanyDto extends CreateUserDto {
    /** Name of the company */
    @IsString()
    @IsNotEmpty()
    name: string;

    /** SIRET number (French business registration number - exactly 14 digits) */
    @IsOptional()
    @Length(14, 14, { message: 'siretNumber must be exactly 14 characters long' })
    @Matches(/^\d+$/, { message: 'siretNumber must contain only digits' })
    siretNumber?: string;

    /** NAF code (French business activity code) */
    @IsOptional()
    @IsEnum(NafCode)
    nafCode?: NafCode;

    /** Type of organizational structure */
    @IsOptional()
    @IsEnum(StructureType)
    structureType?: StructureType;

    /** Legal status of the company */
    @IsOptional()
    @IsEnum(LegalStatus)
    legalStatus?: LegalStatus;

    /** Physical address of the company */
    @IsOptional()
    @IsString()
    address: string;

    /** Optional logo URL or path for the company */
    @IsOptional()
    @IsString()
    logo?: string;

    /** Internships posts associated with the company, needed only for update of company */
    @IsOptional()
    readonly posts: string[] = [];

    constructor(partial: Partial<CreateCompanyDto>) {
        super();
        Object.assign(this, partial);
    }
}
