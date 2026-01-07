import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

/**
 * DTO for creating a Notification
 */
export class CreateNotificationDto {
    /**
     * Reference to the User who receives the notification
     */
    @IsNotEmpty()
    userId: Types.ObjectId;

    /**
     * Notification message content
     */
    @IsString()
    @IsNotEmpty()
    message: string;

    /**
     * Link to return to when the notification is clicked
     */
    @IsOptional()
    @IsString()
    returnLink?: string;
}
