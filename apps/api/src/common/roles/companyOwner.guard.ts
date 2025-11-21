import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from './roles.enum';
import { PostService } from '../../post/post.service';

/**
 * Guard that ensures a COMPANY user can only update/delete their own company resource.
 * If the authenticated user's role is COMPANY, their token 'sub' must match the route :id param.
 */
@Injectable()
export class CompanyOwnerGuard implements CanActivate {
    constructor(private readonly postService: PostService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const { user, params } = req || {};

        // If no authenticated user, deny access (other guards should normally handle auth)
        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Allow ADMIN to bypass ownership check - they can modify any company
        if (user.role === Role.ADMIN) {
            return true;
        }

        // For COMPANY role: verify they own the resource they're trying to modify
        if (user.role !== Role.COMPANY) {
            throw new ForbiddenException("You can't access this resource");
        }
        const companyId = params?.id;
        const userSub = user.sub;

        // If token does not carry a subject or route id is missing, deny
        if (!companyId || !userSub) throw new ForbiddenException('Ownership cannot be verified');

        // Maybe the id given is a post id, so we check
        const post = await this.postService.findOne(companyId);

        if (post) {
            // We check if the post belong to this company
            if (String(post.companyId) !== String(userSub)) {
                throw new ForbiddenException('You cannot modify this post');
            } else {
                return true;
            }
        }

        // Compare as strings (ObjectId or string)
        if (String(userSub) !== String(companyId)) throw new ForbiddenException('You can only modify your own company');

        return true;
    }
}
