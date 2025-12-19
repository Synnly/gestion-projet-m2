import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Company } from '../company/company.schema';

/**
 * PostType
 *
 * Enumeration of supported work modes for posts. Kept as a string enum
 * so values are stored/read as human-readable labels in the database.
 */
export enum PostType {
    Presentiel = 'Présentiel',
    Teletravail = 'Télétravail',
    Hybride = 'Hybride',
}

/**
 * Mongoose `Post` schema for internship/job offers.
 * Includes title, description, salary range, `keySkills` and optional GeoJSON `location`.
 * `location` is indexed with `2dsphere`; compound and text indexes exist for production queries.
 * Schema is tuned for efficient filtering (company, sector, type) and full-text search.
 */
@Schema({ timestamps: true })
export class Post {
    /** Unique MongoDB identifier */
    _id: Types.ObjectId;

    /** Post's title */
    @Prop({ required: true })
    title: string;

    /** Post's description */
    @Prop({ required: true })
    description: string;

    /** Duration of the internship */
    @Prop()
    duration: string;

    /** Starting date of the internship */
    @Prop()
    startDate: string;

    /** Minimal wage of the internship */
    @Prop({ min: 0 })
    minSalary: number;

    /**Maximal wage of the internship */
    @Prop({ min: 0 })
    maxSalary: number;

    @Prop({ type: Boolean, default: false })
    isCoverLetterRequired: string;

    /** Work sector of the internship (IT, Science, ...) */
    @Prop()
    sector: string;

    /** Skills required for the internship */
    @Prop({ type: [String], default: [] })
    keySkills: string[];

    /** Either the adress of the company, or the work place of the internship */
    @Prop()
    adress: string;

    /** Work mode of the internship (in-person, remote or hybrid) */
    @Prop({ required: true, type: String, enum: PostType, default: PostType.Presentiel })
    type: PostType;

    /** Does the post is visible on the client or not */
    @Prop({ default: true })
    isVisible: boolean;

    @Prop({
        type: {
            type: String,
            enum: ['Point'],
            required: false,
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: false,
        },
    })

    /**
     * Optional GeoJSON point describing the post's coordinates.
     * Stored as `{ type: 'Point', coordinates: [lon, lat] }`.
     */
    location?: {
        type: 'Point';
        coordinates: [number, number]; // [lon, lat]
    };

    /** Reference to the company offering the internship */
    @Prop({ required: true, type: Types.ObjectId, ref: 'Company' })
    company: Company;

    @Prop({ default: [] })
    applications: Types.ObjectId[];
}

export type PostDocument = Post & Document;

export const PostSchema = SchemaFactory.createForClass(Post);

// DATABASE INDEXES

// Geospatial index for location-based queries (radius search)
PostSchema.index({ location: '2dsphere' });

// Compound index for most common query pattern (filter by company + visibility + sort by date)
// This covers queries like: GET /company/:id/posts?isVisible=true&sort=dateDesc
PostSchema.index({ company: 1, isVisible: 1, createdAt: -1 }, { name: 'company_visible_date' });

// Index for filtering visible posts by sector
PostSchema.index({ isVisible: 1, sector: 1 }, { name: 'visible_sector' });

// Index for filtering visible posts by type (Présentiel/Télétravail/Hybride)
PostSchema.index({ isVisible: 1, type: 1 }, { name: 'visible_type' });

// Index for date-based sorting within a company
PostSchema.index({ company: 1, createdAt: -1 }, { name: 'company_date' });

// Index for salary range queries (overlap logic)
PostSchema.index({ minSalary: 1, maxSalary: 1 }, { name: 'salary_range' });

// Full-text search index with weighted fields for global search
// Weights: title (highest priority) > description > sector > duration
// Usage: db.posts.find({ $text: { $search: "developer" } })
PostSchema.index(
    {
        title: 'text',
        description: 'text',
        sector: 'text',
        duration: 'text',
    },
    {
        weights: {
            title: 10,
            description: 5,
            sector: 3,
            duration: 1,
        },
        name: 'post_text_search',
        default_language: 'french',
    },
);
