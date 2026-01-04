import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type AdminDocument = Admin & Document;

/**
 * Mongoose schema representing an Admin.
 */
@Schema({ timestamps: true })
export class Admin {
    /** The MongoDB ObjectId for the admin. */
    _id: Types.ObjectId;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
