import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post {
    /** Unique MongoDB identifier */
    _id: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop()
    duration: string;

    @Prop()
    startDate: string;

    @Prop({ min: 0 })
    minSalary: number;

    @Prop({ min: 0 })
    maxSalary: number;

    @Prop()
    sector: string;

    @Prop()
    creationDate: string;

    @Prop({ type: [String], default: [] })
    keySkills: string[];

    @Prop()
    adress: string;

    @Prop({ enum: ['Présentiel', 'Télétravail', 'Hybride'], default: 'Présentiel' })
    type: string;

    @Prop({ default: true })
    isVisible: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
