import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from './roles.enum';
import { ApplicationService } from '../../application/application.service';
import { Types } from 'mongoose';

@Injectable()
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
