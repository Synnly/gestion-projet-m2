import { Expose, Exclude, Transform } from 'class-transformer';
import { Types } from 'mongoose';

/**
 * Data Transfer Object representing a Notification returned by the API.
 *
 * Uses `class-transformer` decorators to control exposed fields.
 */
@Exclude()
export class NotificationDto {
    /** The notification's MongoDB ObjectId. */
    @Transform((params) => params.obj._id)
    @Expose()
    _id: Types.ObjectId;

    /** Reference to the User who receives the notification */
    @Expose()
    userId: Types.ObjectId;

    /** Notification message content */
    @Expose()
    message: string;

    /** Link to return to when the notification is clicked */
    @Expose()
    returnLink: string;

    /** Indicates whether the notification has been read */
    @Expose()
    read: boolean;

    /** Creation timestamp */
    @Expose()
    createdAt: Date;

    /** Last update timestamp */
    @Expose()
    updatedAt: Date;

    /**
     * Create a partial `NotificationDto` instance.
     * @param partial Optional partial data to assign to the DTO.
     */
    constructor(partial?: Partial<NotificationDto>) {
        Object.assign(this, partial);
    }
}
