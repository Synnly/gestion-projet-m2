import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Mongoose document type for Stats entities
 */
export type StatsDocument = Stats & Document;

/**
 * Schema for system statistics
 * Represents computed statistics about the system
 */
@Schema()
export class Stats {
    /** Total number of users in the system */
    @Prop()
    totalUsers: number;

    /** Total number of companies in the system */
    @Prop()
    totalCompanies: number;

    /** Total number of students in the system */
    @Prop()
    totalStudents: number;

    /** Total number of applications in the system */
    @Prop()
    totalApplications: number;

    /** Total number of posts in the system */
    @Prop()
    totalPosts: number;
}

/**
 * Mongoose schema factory for Stats
 */
export const StatsSchema = SchemaFactory.createForClass(Stats);