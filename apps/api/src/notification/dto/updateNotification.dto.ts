import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating a Notification.
 *
 * All fields are optional for partial updates.
 */
export class UpdateNotificationDto {
    /**
     * Notification message content
     */
    @IsOptional()
    @IsString()
    message?: string;

    /**
     * Link to return to when the notification is clicked
     */
    @IsOptional()
    @IsString()
    returnLink?: string;

    /**
     * Indicates whether the notification has been read
     */
    @IsOptional()
    @IsBoolean()
    read?: boolean;
}
