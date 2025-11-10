import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Role } from '../common/roles/roles.enum';

/**
 * Type representing the payload of a refresh token JWT.
 */
export type RefreshTokenPayload = {
    /** The refresh token ID */
    _id: Types.ObjectId;
    /** The user ID who was issued this token */
    sub: Types.ObjectId;
    /** The role of the user */
    role: Role;
    /** Expiration date of the token */
    exp: Date;
    /** Date of issue of the token */
    iat: Date;
};

export type AccessTokenPayload = {
    /** The user ID who was issued this token */
    sub: Types.ObjectId;
    /** Expiration date of the token */
    exp: Date;
    /** Date of issue of the token */
    iat: Date;
    /** Role of the user */
    role: string;
    /** Email of the user */
    email: string;
    /** The refresh token ID associated with this access token */
    rti: Types.ObjectId;
};

/**
 * Type combining RefreshToken schema with Mongoose Document.
 * Used for type safety when working with Mongoose models.
 */
export type RefreshTokenDocument = RefreshToken & Document;

/**
 * MongoDB schema for RefreshToken entities.
 * Stores refresh tokens for user authentication.
 * Includes automatic timestamps (createdAt, updatedAt).
 */
@Schema({ timestamps: true })
export class RefreshToken {
    /** Unique MongoDB identifier */
    _id: Types.ObjectId;

    /** The user ID associated with this refresh token */
    @Prop({ required: true, type: Types.ObjectId })
    userId: Types.ObjectId;

    /** The role of the user associated with this refresh token */
    @Prop({ required: true, type: String, enum: Role })
    role: Role;

    /** Expiration date of the refresh token */
    @Prop({ required: true })
    expiresAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
