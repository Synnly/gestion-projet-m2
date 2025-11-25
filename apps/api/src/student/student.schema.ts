import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentDocument = Student & Document;

/**
 * Mongoose schema representing a Student.
 *
 * Contains basic profile fields and an optional `deletedAt` timestamp for soft-deletes.
 */
@Schema({ timestamps: true })
export class Student {
    /** The MongoDB ObjectId for the student. */
    _id: Types.ObjectId;

    /** The student's first name. */
    @Prop({ required: true, trim: true })
    firstName: string;

    /** The student's last name. */
    @Prop({ required: true, trim: true })
    lastName: string;

    /**
     * Timestamp indicating when the student was soft-deleted.
     * When present, the record should be considered deleted.
     */
    @Prop({ required: false })
    deletedAt?: Date;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
