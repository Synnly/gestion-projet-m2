import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum';

/**
 * Metadata key used to store required roles for routes
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that specifies which roles are required to access a route or controller
 * Used in conjunction with RolesGuard to enforce role-based access control
 * @param roles The roles that are allowed to access the decorated route
 * @returns A decorator function that attaches role metadata
 * @example
 * @Roles(Role.ADMIN, Role.COMPANY)
 * @Get('/protected')
 * async protectedRoute() { }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
