import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ForumDocument } from '../forum.schema';

@Injectable()
export class ForumAccessGuard implements CanActivate {
    constructor(@InjectModel('Forum') private readonly forumModel: Model<ForumDocument>) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const forumId = request.params.forumId;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (user.role === 'STUDENT') {
            return true;
        }

        if (user.role === 'COMPANY') {
            const forum = await this.forumModel.findById(forumId);
            if (!forum) {
                throw new NotFoundException('Forum not found');
            }

            if (!forum.company?._id) {
                return true;
            }

            if (forum.company?._id.toString() === user.companyId?.toString()) {
                return true;
            }

            throw new ForbiddenException('Access denied to this forum');
        }

        if (user.role === 'ADMIN') {
            return true;
        }

        throw new ForbiddenException('Access denied to this forum');
    }
}
