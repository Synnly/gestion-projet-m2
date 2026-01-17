import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/**
 * Notification Schema
 */
@Schema({ timestamps: true })
export class Notification {
    /**
     * Reference to the User who receives the notification
     */
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    /**
     * Notification message content
     */
    @Prop({ required: true })
    message: string;

    /**
     * Link to return to when the notification is clicked
     */
    @Prop({ required: false, default: '' })
    returnLink: string;

    /**
     * Indicates whether the notification has been read
     */
    @Prop({ default: false })
    read: boolean;
}
