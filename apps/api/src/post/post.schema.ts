import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post {
    /** Unique MongoDB identifier */
    _id: Types.ObjectId;

    /** Post's title */
    @Prop({ required: true })
    title: string;

    /** Post's description */
    @Prop({ required: true })
    description: string;

    /** Duration of the internship */
    @Prop()
    duration: string;

    /** Starting date of the internship */
    @Prop()
    startDate: string;

    /** Minimal wage of the internship */
    @Prop({ min: 0 })
    minSalary: number;

    /**Maximal wage of the internship */
    @Prop({ min: 0 })
    maxSalary: number;

    /** Work sector of the internship (IT, Science, ...) */
    @Prop()
    sector: string;

    /** Skills required for the internship */
    @Prop({ type: [String], default: [] })
    keySkills: string[];

    /** Either the adress of the company, or the work place of the internship */
    @Prop()
    adress: string;

    /** Work mode of the internship (in-person, remote or hybrid) */
    @Prop({ enum: ['Présentiel', 'Télétravail', 'Hybride'], default: 'Présentiel' })
    type: string;

    /** Does the post is visible on the client or not */
    @Prop({ default: true })
    isVisible: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
