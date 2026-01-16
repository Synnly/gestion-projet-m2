import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/user.schema';
import { Topic } from '../topic/topic.schema';

export type MessageDocument = Message & Document;

/**
 * Schema representing a forum message.
 */
@Schema({ timestamps: true })
export class Message {
    /** Unique identifier for the message */
    _id: Types.ObjectId;

    /** Content of the message */
    @Prop({ required: true })
    content: string;

    /** Author ID of the message creator */
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    author: Types.ObjectId;

    /** Topic ID that this message belongs to */
    @Prop({ type: Types.ObjectId, ref: 'Topic', required: true })
    topicId: Types.ObjectId;

    /** Creation timestamp */
    createdAt: Date;

    /** Last update timestamp */
    updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
