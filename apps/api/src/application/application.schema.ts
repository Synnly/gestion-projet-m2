import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Post } from '../post/post.schema';
import { Student } from '../student/student.schema';

/**
 * Enumeration of possible application statuses.
 * Represents the different states an application can be in.
 */
export enum ApplicationStatus {
    /** Application has been submitted but not yet reviewed */
    Pending = 'Pending',

    /** Application has been viewed by the recipient */
    Read = 'Read',

    /** Application has been accepted */
    Accepted = 'Accepted',

    /** Application has been rejected */
    Rejected = 'Rejected',
}

@Schema({ timestamps: true })
export class Application {
    /** Unique MongoDB identifier */
    _id: Types.ObjectId;

    /** Reference to the post for which the application is sent */
    @Prop({ required: true, type: Types.ObjectId, ref: 'Post' })
    post: Post;

    /** Reference to the student who sent the application */
    @Prop({ required: true, type: Types.ObjectId, ref: 'Student' })
    student: Student;

    /** Status of the application */
    @Prop({ required: true, type: String, enum: ApplicationStatus, default: ApplicationStatus.Pending })
    status: ApplicationStatus;

    /** The url or path to the resume submitted with the application */
    @Prop({ required: true })
    resume: string;

    /** The url or path to the cover letter submitted with the application */
    @Prop({ required: false, trim: true })
    coverLetter?: string;

    /** Date when the application was soft-deleted (for soft-delete functionality) */
    @Prop({ required: false })
    deletedAt?: Date;
}

export type ApplicationDocument = Application & Document;

export const ApplicationSchema = SchemaFactory.createForClass(Application);
