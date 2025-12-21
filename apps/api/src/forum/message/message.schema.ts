import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({ timestamps: true })
export class Message {
    /**
     * sender of the message
     */
    @Prop({ type: Types.ObjectId, ref: 'User' })
    author: Types.ObjectId;

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
    parentMessage: Types.ObjectId;
}

export type ForumDocument = Message & Document;

export const ForumSchema = SchemaFactory.createForClass(Message);
