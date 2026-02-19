import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DatabaseExportDocument = DatabaseExport & Document;

export enum ExportStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    FAILED = 'failed',
}

/**
 * Mongoose schema representing a database export operation.
 * Tracks the state of long-running export jobs.
 */
@Schema({ timestamps: true })
export class DatabaseExport {
    /** The MongoDB ObjectId for the export. */
    _id: Types.ObjectId;

    /** The admin user who initiated the export. */
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    adminId: Types.ObjectId;

    /** Current status of the export operation. */
    @Prop({ type: String, enum: Object.values(ExportStatus), default: ExportStatus.PENDING })
    status: ExportStatus;

    /** URL or path to download the completed export file. */
    @Prop({ type: String })
    fileUrl?: string;

    /** File key in S3/MinIO storage. */
    @Prop({ type: String })
    fileKey?: string;

    /** Size of the export file in bytes. */
    @Prop({ type: Number })
    fileSize?: number;

    /** Error message if the export failed. */
    @Prop({ type: String })
    errorMessage?: string;

    /** Date when the export was started. */
    @Prop({ type: Date })
    startedAt?: Date;

    /** Date when the export was completed or failed. */
    @Prop({ type: Date })
    completedAt?: Date;

    /** Total number of collections exported. */
    @Prop({ type: Number })
    collectionsCount?: number;

    /** Total number of documents exported. */
    @Prop({ type: Number })
    documentsCount?: number;

    /** Timestamp when created. */
    createdAt?: Date;

    /** Timestamp when last updated. */
    updatedAt?: Date;
}

export const DatabaseExportSchema = SchemaFactory.createForClass(DatabaseExport);
