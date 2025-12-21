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

    /**
     * Name of the company (denormalized for text search)
     */
    @Prop()
    companyName?: string;

    /*
    @Prop({ type: Types.ObjectId, ref: 'Topic' })
    topics: Topic[];
     */

    /**
     * Number of topics in the forum
     */
    @Prop({ default: 0 })
    nbTopics: number;

    /**
     * Number of messages in the forum across all topics
     */
    @Prop({ default: 0 })
    nbMessages: number;
}

export type ForumDocument = Forum & Document;

export const ForumSchema = SchemaFactory.createForClass(Forum);

ForumSchema.index({ companyName: 'text' }, { name: 'forum_text_search' });
