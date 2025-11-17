import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePostDto {
    /**
     * Post's title
     * Is required for the creation
     */
    @IsString()
    title: string;

    /**
     * Post's description
     * Is required for the creation
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
    @IsNumber()
    @Min(0)
    minSalary?: number;

    /**
     * Maximum wage of the internship
     */
    @IsOptional()
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
     * Post's creation Date
     * Must be the exact date
     */
    @IsOptional()
    @IsDateString()
    creationDate?: string;

    /**
     * Skills required for the internship
     * Must be a maximum of 5
     */
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
    type?: string;

    /**
     * Only for the client dev, for the post display
     */
    @IsOptional()
    @IsBoolean()
    isVisible: boolean = true;

    constructor(partial?: Partial<CreatePostDto>) {
        if (partial) {
            Object.assign(this, partial);
        }
    }
}