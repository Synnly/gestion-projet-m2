import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
    timestamps: true, // Pour savoir quand l'annonce a été vue
    collection: 'pendingseen',
})
export class PendingSeen extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
    postId: Types.ObjectId;

    @Prop({
        type: Date,
        default: Date.now,
    })
    createdAt: Date;
}

export const PendingSeenSchema = SchemaFactory.createForClass(PendingSeen);

// Index composé unique : Un utilisateur ne peut avoir qu'une seule entrée "pending" par annonce
PendingSeenSchema.index({ userId: 1, postId: 1 }, { unique: true });
