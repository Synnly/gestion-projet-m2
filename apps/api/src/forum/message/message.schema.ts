import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Message {
    /**
     * sender of the message
     */
    @Prop({ type: Types.ObjectId, ref: 'User' })
    authorId: Types.ObjectId;

    /**
     * Content of the message
     */
    @Prop({ required: true })
    content: string;

    /**
     * Topic to which the message belongs
     */
    @Prop({ type: Types.ObjectId, ref: 'Topic' })
    topicId: Types.ObjectId;

    /**
     * Reply to another message in the same topic
     */
    @Prop({ type: Types.ObjectId, ref: 'Message' })
    parentMessageId: Types.ObjectId;

    createdAt: Date;
}

export type MessageDocument = Message & Document;

export const MessageSchema = SchemaFactory.createForClass(Message);
