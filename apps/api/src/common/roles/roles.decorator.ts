import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum';

export const ROLES_KEY = 'roles';

/**
 * Attach required roles metadata to a route or controller.
 * Example: @Roles(Role.ADMIN, Role.COMPANY)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
