import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Company } from 'src/company/company.schema';

export enum PostType {
    Presentiel = 'Présentiel',
    Teletravail = 'Télétravail',
    Hybride = 'Hybride',
}

@Schema({ timestamps: true })
export class Post {
    /** Unique MongoDB identifier */
    _id: Types.ObjectId;

    // /** Post's company id */
    // @Prop({ type: Types.ObjectId, ref: Company.name, required: true })
    // companyId: Types.ObjectId;
    
    /** Reference to the company offering the internship */
    @Prop({ required: true, type: Types.ObjectId, ref: 'Company' })
    companyId: Company;

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
    @Prop({ required: true, type: String, enum: PostType, default: PostType.Presentiel })
    type: PostType;

    /** Does the post is visible on the client or not */
    @Prop({ default: true })
    isVisible: boolean;

    /** Date when the post was soft-deleted (for soft-delete functionality) */
    @Prop({ required: false })
    deletedAt?: Date;
}

export type PostDocument = Post & Document;

export const PostSchema = SchemaFactory.createForClass(Post);
