import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true })
export class Topic {
    // Unique identifier for the topic
    _id: Types.ObjectId;

    // Title of the topic
    @Prop({ required: true })
    title: string;

    // Description or content of the topic
    @Prop({ required: false })
    description: string;

    // Array of message IDs associated with the topic
    @Prop({ required: true, default: [] })
    messages: Types.ObjectId[];

    // Author ID of the topic creator
    @Prop({ required: true })
    author: Types.ObjectId;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
