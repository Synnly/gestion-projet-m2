import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Company } from '../company/company.schema';

@Schema({ timestamps: true })
export class Forum {
    /**
     * Unique MongoDB identifier
     */
    _id: Types.ObjectId;

    /**
     * Reference to the company owning the forum. If nullish, the forum is the general forum.
     */
    @Prop({ type: Types.ObjectId, ref: 'Company' })
    company?: Company;

    /*
    @Prop({ type: Types.ObjectId, ref: 'Topic' })
    topics: Topic[];
     */
}

export type ForumDocument = Forum & Document;

export const ForumSchema = SchemaFactory.createForClass(Forum);
