/**
 * Data Transfer Object for post
 * Represents the structure of post data for their creation
 */
import { Types } from 'mongoose';
import { Post, PostType } from '../post.schema';
import { CompanyDto } from '../../company/dto/company.dto';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

@Exclude()
export class PostDto {
    /** Unique identifier of the company */
    @Transform((params) => params.obj._id)
    @Expose()
    _id: Types.ObjectId;

    /**
     * Post's title
     * Is required for the creation
     */
    @Expose()
    title: string;

    /**
     * Post's description
     * Is required for the creation
     */
    @Expose()
    description: string;

    /**
     * Duration of the internship
     */
    @Expose()
    duration?: string;

    /**
     * Start date of the internship
     */
    @Expose()
    startDate?: string;

    /**
     * Minimum wage of the internship
     */
    @Expose()
    minSalary?: number;

    /**
     * Maximum wage of the internship
     */
    @Expose()
    maxSalary?: number;

    /**
     * Sector of the internship
     * Example : IT, Science, ...
     */
    @Expose()
    sector?: string;

    /**
     * Skills required for the internship
     * Must be a maximum of 5
     */
    @Expose()
    keySkills?: string[];

    /**
     * Adress of the company or work area
     */
    @Expose()
    adress?: string;

    /**
     * Work mode of the internship
     * Must be either in-person, remote, or hybrid
     */
    @Expose()
    type?: PostType;

    /**
     * Only for the client dev, for the post display
     */
    @Expose()
    isVisible?: boolean;

    @Expose()
    createdAt?: string;

    @Expose()
    isCoverLetterRequired: boolean;

    /** Reference to the company offering the internship */
    @Expose()
    @ValidateNested({ each: true })
    @Type(() => CompanyDto)
    company: CompanyDto;

    constructor(partial?: Partial<Post>) {
        if (partial) {
            Object.assign(this, partial);
            this.isVisible = !!this.title && !!this.description;
        }
    }
}
