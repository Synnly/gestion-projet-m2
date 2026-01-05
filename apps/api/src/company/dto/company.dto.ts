import { Expose, Exclude, Type, Transform } from 'class-transformer';
import { StructureType, LegalStatus } from '../company.schema';
import { NafCode } from '../nafCodes.enum';
import { Types } from 'mongoose';
import { PostDto } from '../../post/dto/post.dto';
import { ValidateNested } from 'class-validator';

/**
 * Data Transfer Object for company responses
 * Represents the structure of company data sent to clients
 */
@Exclude()
export class CompanyDto {
    /** Unique identifier of the company */
    @Transform((params) => params.obj._id)
    @Expose()
    _id: Types.ObjectId;

    /** Email address of the company */
    @Expose()
    email: string;

    /** Name of the company */
    @Expose()
    name: string;

    /** SIRET number (French business registration number) */
    @Expose()
    siretNumber?: string;

    /** NAF code (French business activity code) */
    @Expose()
    nafCode?: NafCode;

    /** Type of organizational structure */
    @Expose()
    structureType?: StructureType;

    /** Legal status of the company */
    @Expose()
    legalStatus?: LegalStatus;

    /** Street number of the company address */
    @Expose()
    streetNumber?: string;

    /** Street name of the company address */
    @Expose()
    streetName?: string;

    /** Postal code of the company address */
    @Expose()
    postalCode?: string;

    /** City of the company address */
    @Expose()
    city?: string;

    /** Country of the company address */
    @Expose()
    country?: string;

    /** Whether the company account is validated */
    @Expose()
    isValid?: boolean;

    /** Whether the company email is verified */
    @Expose()
    isVerified?: boolean;

    /** Logo URL or path for the company */
    @Expose()
    logo?: string;

    /** Internships posts associated with the company */
    @Expose()
    @ValidateNested({ each: true })
    @Type(() => PostDto)
    posts: PostDto[];

    @Expose()
    createdAt: Date;

    /**
     * Constructs a CompanyDto instance
     * @param company Partial company data to initialize the DTO
     */
    constructor(company?: Partial<CompanyDto>) {
        Object.assign(this, company);
    }
}
