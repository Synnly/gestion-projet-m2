import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationService } from '../notification.service';
import { Role } from '../../common/roles/roles.enum';

/**
 * Guard that ensures a user can only access/modify their own notifications.
 *
 * Behaviour:
 * - ADMIN bypasses the check (can access any notification)
 * - STUDENT and COMPANY must own the notification (notification.userId === user.sub)
 * - Throws NotFoundException if notification doesn't exist
 * - Throws ForbiddenException if user doesn't own the notification
 */
@Injectable()
export class NotificationOwnerGuard implements CanActivate {
    constructor(private readonly notificationService: NotificationService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const { user, params } = req || {};

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // ADMIN can access any notification
        if (user.role === Role.ADMIN) return true;

        // Get the notification ID from route params
        const notificationId = params?.notificationId;
        if (!notificationId) {
            throw new ForbiddenException('Notification ID is required');
        }

        // Fetch the notification to check ownership
        const notification = await this.notificationService.findOne(notificationId);
        if (!notification) {
            throw new NotFoundException(`Notification with id ${notificationId} not found`);
        }

        // Verify ownership
        const userSub = user.sub || user._id || user.id;
        if (!userSub) {
            throw new ForbiddenException('User ID cannot be determined');
        }

        if (String(notification.userId) !== String(userSub)) {
            throw new ForbiddenException('You can only access your own notifications');
        }

        return true;
    }
}
