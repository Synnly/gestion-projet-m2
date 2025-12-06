import {
    ArrayMaxSize,
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsDateString,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostType } from '../post.schema';

export class UpdatePostDto {
    /**
     * Post's title
     * Is required for the update
     */
    @IsString()
    title: string;

    /**
     * Post's description
     * Is required for the update
     */
    @IsString()
    description: string;

    /**
     * Duration of the internship
     */
    @IsOptional()
    @IsString()
    duration?: string;

    /**
     * Start date of the internship
     */
    @IsOptional()
    @IsDateString()
    startDate?: string;

    /**
     * Minimum wage of the internship
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minSalary?: number;

    /**
     * Maximum wage of the internship
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxSalary?: number;

    /**
     * Sector of the internship
     * Example : IT, Science, ...
     */
    @IsOptional()
    @IsString()
    sector?: string;

    /**
     * Skills required for the internship
     * Must be a maximum of 5
     */
    @IsArray()
    @ArrayMaxSize(5)
    @ArrayUnique()
    @IsString({ each: true })
    keySkills?: string[];

    /**
     * Adress of the company or work area
     */
    @IsOptional()
    @IsString()
    adress?: string;

    /**
     * Work mode of the internship
     * Must be either in-person, remote, or hybrid
     */
    @IsOptional()
    @IsEnum(PostType)
    type?: PostType;

    /**
     * Only for the client dev, for the post display
     */
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;

    constructor(partial?: Partial<UpdatePostDto>) {
        if (partial) {
            Object.assign(this, partial);
            this.isVisible = !!this.title && !!this.description;
        }
    }
}
