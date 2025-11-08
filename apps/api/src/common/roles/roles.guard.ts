import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role, RoleHierarchy } from './roles.enum';

/**
 * Guard that enforces role-based access control using role hierarchy
 * Checks if the authenticated user has one of the required roles specified by the @Roles decorator
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    /**
     * Determines if the current user has permission to access the route
     * Uses role hierarchy to check if the user's role grants access
     * @param context The execution context containing the HTTP request and metadata
     * @returns True if the user has one of the required roles
     * @throws {ForbiddenException} if the user role is not found or access is denied
     */
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) return true;

        const { user } = context.switchToHttp().getRequest();
        if (!user?.role) throw new ForbiddenException('User role not found');

        const userRoles = RoleHierarchy[user.role];
        const isAllowed = requiredRoles.some((role) => userRoles.includes(role));

        if (!isAllowed) throw new ForbiddenException('Access denied');
        return true;
    }
}
