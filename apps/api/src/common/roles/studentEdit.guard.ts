import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from './roles.enum';

/**
 * Guard that ensures a STUDENT user can only edit their own student resource.
 *
 * Behaviour:
 * - ADMIN bypasses the check
 * - STUDENT must have token `sub` equal to route `:studentId`
 * - Other roles are denied
 */
@Injectable()
export class StudentEditGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const { user, params } = req || {};

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // ADMIN can access any student's resource
        if (user.role === Role.ADMIN) return true;

        // For STUDENT role: verify they are requesting their own record
        if (user.role === Role.STUDENT) {
            const studentId = params?.studentId;
            const userSub = user.sub || user._id || user.id;
            if (!studentId || !userSub) throw new ForbiddenException('Ownership cannot be verified');
            if (String(userSub) !== String(studentId))
                throw new ForbiddenException('You can only edit your own student resource');
            return true;
        }

        // All other roles denied
        throw new ForbiddenException("You can't edit this resource");
    }
}
