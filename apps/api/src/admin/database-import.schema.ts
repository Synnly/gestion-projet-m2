import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DatabaseImportDocument = DatabaseImport & Document;

export enum ImportStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    FAILED = 'failed',
}

/**
 * Mongoose schema representing a database import operation.
 * Tracks the state of long-running import jobs.
 */
@Schema({ timestamps: true })
export class DatabaseImport {
    /** The MongoDB ObjectId for the import. */
    _id: Types.ObjectId;

    /** The admin user who initiated the import. */
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    adminId: Types.ObjectId;

    /** Current status of the import operation. */
    @Prop({ type: String, enum: Object.values(ImportStatus), default: ImportStatus.PENDING })
    status: ImportStatus;

    /** Original filename of the import file. */
    @Prop({ type: String })
    filename?: string;

    /** File key in storage. */
    @Prop({ type: String })
    fileKey?: string;

    /** Size of the import file in bytes. */
    @Prop({ type: Number })
    fileSize?: number;

    /** Error message if the import failed. */
    @Prop({ type: String })
    errorMessage?: string;

    /** Date when the import was started. */
    @Prop({ type: Date })
    startedAt?: Date;

    /** Date when the import was completed or failed. */
    @Prop({ type: Date })
    completedAt?: Date;

    /** Total number of collections imported. */
    @Prop({ type: Number })
    collectionsCount?: number;

    /** Total number of documents imported. */
    @Prop({ type: Number })
    documentsCount?: number;

    /** Timestamp when created. */
    createdAt?: Date;

    /** Timestamp when last updated. */
    updatedAt?: Date;
}

export const DatabaseImportSchema = SchemaFactory.createForClass(DatabaseImport);
