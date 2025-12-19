import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from './roles.enum';
import { ApplicationService } from '../../application/application.service';
import { Types } from 'mongoose';

@Injectable()

/**
 * Guard to check if the authenticated user is the owner of the application resource.
 * Behaviour:
 * - ADMIN users have access to all resources.
 * - COMPANY users can access applications related to their posts.
 * - STUDENT users can access their own applications.
 * - Other roles are denied access.
 *
 * If ownership cannot be verified, a ForbiddenException is thrown.
 * Requires `applicationId` parameter in the route.
 */
export class ApplicationOwnerGuard implements CanActivate {
    constructor(private readonly applicationService: ApplicationService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const { user, params } = req || {};

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // ADMIN can access any application's resource
        if (user.role === Role.ADMIN) return true;

        // Only COMPANY and STUDENT roles can potentially access applications
        if (user.role !== Role.COMPANY && user.role !== Role.STUDENT) {
            throw new ForbiddenException("You can't access this resource");
        }

        const userId = user.sub || user._id || user.id;
        const applicationId: string = params?.applicationId;

        if (!applicationId || !userId) throw new ForbiddenException('Ownership cannot be verified');

        const application = await this.applicationService.findOne(new Types.ObjectId(applicationId));
        if (!application) throw new ForbiddenException("You can't access this resource");

        // Verify ownership based on role
        if (user.role === Role.COMPANY && application?.post?.company?._id.toString() !== userId.toString()) {
            throw new ForbiddenException("You can't access this resource");
        }
        if (user.role === Role.STUDENT && application?.student?._id.toString() !== userId.toString()) {
            throw new ForbiddenException("You can't access this resource");
        }

        return true;
    }
}
