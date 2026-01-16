import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export enum ReportReason {
    SPAM = 'Spam',
    INAPPROPRIATE_CONTENT = 'Contenu inapproprié',
    HARASSMENT = 'Harcèlement',
    OTHER = 'Autre',
}

/**
 * Mongoose schema representing a Report.
 */
@Schema({ timestamps: true })
export class Report {
    /** The MongoDB ObjectId for the report. */
    _id: Types.ObjectId;

    /** The date of the report creation. */
    createdAt: Date;

    /** The date of the last update. */
    updatedAt: Date;

    /** The reason for the report. */
    @Prop({ required: true, type: String, enum: ReportReason })
    reason: ReportReason;

    /** Optional explanation for the report. */
    @Prop({ required: false })
    explanation?: string;

    /** The ID of the reported message. */
    @Prop({ required: true, type: Types.ObjectId, ref: 'Message' })
    messageId: Types.ObjectId;

    /** The ID of the user who made the report. */
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    reporterId: Types.ObjectId;
}

export const ReportSchema = SchemaFactory.createForClass(Report);