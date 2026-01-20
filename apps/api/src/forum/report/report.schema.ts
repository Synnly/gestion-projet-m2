import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReportReason } from './reportReason.enum';

@Schema({ timestamps: true })
export class Report {
    /**
     * ID of the reported message
     */
    @Prop({ type: Types.ObjectId, ref: 'Message', required: true })
    messageId: Types.ObjectId;

    /**
     * User who created the report
     */
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    reporterId: Types.ObjectId;

    /**
     * Reason for the report
     */
    @Prop({ type: String, enum: Object.values(ReportReason), required: true })
    reason: ReportReason;

    /**
     * Optional explanation for the report
     */
    @Prop({ type: String, required: false })
    explanation?: string;

    /**
     * Status of the report (pending, reviewed, resolved, rejected)
     */
    @Prop({ type: String, enum: ['pending', 'reviewed', 'resolved', 'rejected'], default: 'pending' })
    status: string;

    createdAt: Date;
    updatedAt: Date;
}

export type ReportDocument = Report & Document;

export const ReportSchema = SchemaFactory.createForClass(Report);
