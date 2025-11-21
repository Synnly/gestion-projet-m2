/**
 * Data Transfer Object for post
 * Represents the structure of post data for their creation
 */
import { Types } from 'mongoose';
import { Post, PostType } from '../post.schema';
import { CompanyDto } from '../../company/dto/company.dto';

export class PostDto {
    /** Unique identifier of the company */
    _id: Types.ObjectId;

    /**
     * Post's title
     * Is required for the creation
     */
    title: string;

    /**
     * Post's description
     * Is required for the creation
     */
    description: string;

    /**
     * Duration of the internship
     */
    duration?: string;

    /**
     * Start date of the internship
     */
    startDate?: string;

    /**
     * Minimum wage of the internship
     */
    minSalary?: number;

    /**
     * Maximum wage of the internship
     */
    maxSalary?: number;

    /**
     * Sector of the internship
     * Example : IT, Science, ...
     */
    sector?: string;

    /**
     * Skills required for the internship
     * Must be a maximum of 5
     */
    keySkills?: string[];

    /**
     * Adress of the company or work area
     */
    adress?: string;

    /**
     * Work mode of the internship
     * Must be either in-person, remote, or hybrid
     */
    type?: PostType;

    /**
     * Only for the client dev, for the post display
     */
    isVisible?: boolean;

    /** Reference to the company offering the internship */
    company: CompanyDto;

    constructor(partial?: Partial<Post>) {
        if (partial) {
            Object.assign(this, partial);
            this.isVisible = !!this.title && !!this.description;
        }
    }
}
