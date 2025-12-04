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
 * Post
 *
 * Mongoose schema class representing an internship/job post. Fields
 * documented here mirror the persisted document and include the
 * `location` GeoJSON Point used by the geospatial filters.
 *
 * Notes about `location`:
 * - `location` is an optional GeoJSON Point with `coordinates: [lon, lat]`.
 * - A `2dsphere` index is created on `location` to support radius queries.
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
}

export type PostDocument = Post & Document;

export const PostSchema = SchemaFactory.createForClass(Post);

// Create a 2dsphere index on the location field for geospatial queries
PostSchema.index({ location: '2dsphere' });
