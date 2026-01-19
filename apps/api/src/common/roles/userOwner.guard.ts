import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from './roles.enum';

/**
 * Guard that ensures a user can only access/modify their own resources.
 *
 * Behaviour:
 * - ADMIN bypasses the check (can access any user's resources)
 * - STUDENT and COMPANY must have token `sub` equal to route `:userId`
 * - Other roles are denied
 */
@Injectable()
export class UserOwnerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const { user, params } = req || {};

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // ADMIN can access any user's resources
        if (user.role === Role.ADMIN) return true;

        // For STUDENT and COMPANY roles: verify they are accessing their own resources
        if (user.role === Role.STUDENT || user.role === Role.COMPANY) {
            const userId = params?.userId;
            const userSub = user.sub || user._id || user.id;
            if (!userId || !userSub) throw new ForbiddenException('Ownership cannot be verified');
            if (String(userSub) !== String(userId))
                throw new ForbiddenException('You can only access your own resources');
            return true;
        }

        // All other roles denied
        throw new ForbiddenException("You can't access this resource");
    }
}
