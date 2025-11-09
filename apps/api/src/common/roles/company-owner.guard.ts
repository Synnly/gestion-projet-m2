import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from './roles.enum';

/**
 * Guard that ensures a COMPANY user can only update/delete their own company resource.
 * If the authenticated user's role is COMPANY, their token 'sub' must match the route :id param.
 */
@Injectable()
export class CompanyOwnerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const { user, params } = req || {};

        // If no authenticated user, deny access (other guards should normally handle auth)
        if (!user) throw new ForbiddenException('User not authenticated');

        // Only enforce ownership check for COMPANY role
        if (user.role !== Role.COMPANY) return true;

        const companyId = params?.id;
        const userSub = user.sub;

        // If token does not carry a subject or route id is missing, deny
        if (!companyId || !userSub) throw new ForbiddenException('Ownership cannot be verified');

        // Compare as strings (ObjectId or string)
        if (String(userSub) !== String(companyId)) throw new ForbiddenException('You can only modify your own company');

        return true;
    }
}
