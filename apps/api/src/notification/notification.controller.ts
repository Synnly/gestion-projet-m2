import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    Put,
    NotFoundException,
    ValidationPipe,
    UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UpdateNotificationDto } from './dto/updateNotification.dto';
import { NotificationDto } from './dto/notification.dto';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { UserOwnerGuard } from '../common/roles/userOwner.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('/api/notifications')
/**
 * Controller for notification-related endpoints.
 *
 * Exposes REST endpoints to create, read, update and delete notification resources.
 */
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    /**
     * Return a list of all notifications.
     * @returns An array of `NotificationDto` objects.
     */
    @Get('')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<NotificationDto[]> {
        const notifications = await this.notificationService.findAll();
        return notifications.map((n) => plainToInstance(NotificationDto, n, { excludeExtraneousValues: true }));
    }

    /**
     * Return all notifications for a specific user.
     * @param userId The id of the user.
     * @returns An array of `NotificationDto` objects.
     */
    @Get('user/:userId')
    @UseGuards(UserOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async findByUserId(@Param('userId', ParseObjectIdPipe) userId: string): Promise<NotificationDto[]> {
        const notifications = await this.notificationService.findByUserId(userId);
        return notifications.map((n) => plainToInstance(NotificationDto, n, { excludeExtraneousValues: true }));
    }

    /**
     * Return all unread notifications for a specific user.
     * @param userId The id of the user.
     * @returns An array of unread `NotificationDto` objects.
     */
    @Get('user/:userId/unread')
    @UseGuards(UserOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async findUnreadByUserId(@Param('userId', ParseObjectIdPipe) userId: string): Promise<NotificationDto[]> {
        const notifications = await this.notificationService.findUnreadByUserId(userId);
        return notifications.map((n) => plainToInstance(NotificationDto, n, { excludeExtraneousValues: true }));
    }

    /**
     * Return the count of unread notifications for a specific user.
     * @param userId The id of the user.
     * @returns An object containing the count of unread notifications.
     */
    @Get('user/:userId/unread/count')
    @UseGuards(UserOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async countUnreadForUser(@Param('userId', ParseObjectIdPipe) userId: string): Promise<{ count: number }> {
        const count = await this.notificationService.countUnreadForUser(userId);
        return { count };
    }

    /**
     * Return a single notification by id.
     * @param notificationId The id of the notification to retrieve.
     * @returns The `NotificationDto` for the requested notification.
     * @throws {NotFoundException} When no notification matches the provided id.
     */
    @Get(':notificationId')
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('notificationId', ParseObjectIdPipe) notificationId: string): Promise<NotificationDto> {
        const notification = await this.notificationService.findOne(notificationId);
        if (!notification) throw new NotFoundException(`Notification with id ${notificationId} not found`);
        return plainToInstance(NotificationDto, notification, { excludeExtraneousValues: true });
    }

    /**
     * Update an existing notification.
     * @param notificationId The id of the notification to update.
     * @param dto The `UpdateNotificationDto` payload used to update the notification.
     * @returns The updated `NotificationDto`.
     * @throws {NotFoundException} When no notification matches the provided id.
     */
    @Put(':notificationId')
    @UseGuards(UserOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('notificationId', ParseObjectIdPipe) notificationId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: UpdateNotificationDto,
    ): Promise<NotificationDto> {
        const notification = await this.notificationService.update(notificationId, dto);
        return plainToInstance(NotificationDto, notification, { excludeExtraneousValues: true });
    }

    /**
     * Mark a notification as read.
     * @param notificationId The id of the notification to mark as read.
     * @returns The updated `NotificationDto`.
     * @throws {NotFoundException} When no notification matches the provided id.
     */
    @Put(':notificationId/read')
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @UseGuards(UserOwnerGuard)
    @HttpCode(HttpStatus.OK)
    async markAsRead(@Param('notificationId', ParseObjectIdPipe) notificationId: string): Promise<NotificationDto> {
        const notification = await this.notificationService.markAsRead(notificationId);
        return plainToInstance(NotificationDto, notification, { excludeExtraneousValues: true });
    }

    /**
     * Mark all notifications for a user as read.
     * @param userId The id of the user.
     * @returns An object containing the count of modified notifications.
     */
    @Put('user/:userId/read-all')
    @UseGuards(UserOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async markAllAsReadForUser(@Param('userId', ParseObjectIdPipe) userId: string): Promise<{ modified: number }> {
        const modified = await this.notificationService.markAllAsReadForUser(userId);
        return { modified };
    }

    /**
     * Delete a notification by id.
     * @param notificationId The id of the notification to delete.
     * @throws {NotFoundException} When no notification matches the provided id.
     */
    @Delete(':notificationId')
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('notificationId', ParseObjectIdPipe) notificationId: string): Promise<void> {
        await this.notificationService.delete(notificationId);
    }

    /**
     * Delete all notifications for a specific user.
     * @param userId The id of the user.
     * @returns An object containing the count of deleted notifications.
     */
    @Delete('user/:userId')
    @UseGuards(UserOwnerGuard)
    @Roles(Role.ADMIN, Role.STUDENT, Role.COMPANY)
    @HttpCode(HttpStatus.OK)
    async deleteAllForUser(@Param('userId', ParseObjectIdPipe) userId: string): Promise<{ deleted: number }> {
        const deleted = await this.notificationService.deleteAllForUser(userId);
        return { deleted };
    }
}
