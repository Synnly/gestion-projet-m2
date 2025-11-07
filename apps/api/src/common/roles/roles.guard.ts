import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role, RoleHierarchy } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

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
