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
     * Unique student number assigned by the institution.
     * Stored as `studentNumber` in the document and must be unique.
     */
    @Prop({ required: true, unique: true, trim: true })
    studentNumber: string;

    /** Flag indicating whether this is the student's first time on the platform. Defaults to true. */
    @Prop({ default: true })
    isFirstTime: boolean;

    /**
     * A short tagline or motto for the student.
     */
    @Prop({ required: false, trim: true })
    tagLine?: string;

    /**
     * A detailed biography or description of the student.
     */
    @Prop({ required: false, trim: true })
    biography?: string;

    /**
     * URL to the student's profile picture.
     */
    @Prop({ required: false, trim: true })
    profilePicture?: string;

    /**
     * URL to the student's default CV document.
     */
    @Prop({ required: false, trim: true })
    defaultCv?: string;

    /**
     * Timestamp indicating when the student was soft-deleted.
     * When present, the record should be considered deleted.
     */
    @Prop({ required: false })
    deletedAt?: Date;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
