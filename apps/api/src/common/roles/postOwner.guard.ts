import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from './roles.enum';
import { PostService } from '../../post/post.service';

/**
 * Guard that ensures a COMPANY user can only update/delete their own posts.
 * If the authenticated user's role is COMPANY, their token 'sub' must match the route :id param.
 */
@Injectable()
export class PostOwnerGuard implements CanActivate {
    constructor(private readonly postService: PostService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const { user, params } = req || {};

        console.log("User:", user);
        console.log("Params:", params);

        // If no authenticated user, deny access (other guards should normally handle auth)
        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Allow ADMIN to bypass ownership check - they can edit any post
        if (user.role === Role.ADMIN) {
            return true;
        }

        // For COMPANY role: verify they own the post they're trying to modify
        if (user.role !== Role.COMPANY) {
            throw new ForbiddenException("You can't access this post");
        }
        const postId = params?.id;
        const userSub = user.sub;

        // If token does not carry a subject or route id is missing, deny
        if (!postId || !userSub) throw new ForbiddenException('Ownership cannot be verified');

        // We check if the id given is linked to an existing post in the database
        const post = await this.postService.findOneEvenIfDeleted(postId);

        if (post) {
            // We check if the post belong to the company requesting
            if (String(post.companyId) !== String(userSub)) {
                throw new ForbiddenException('You cannot modify this post');
            } else {
                // We check if the post has already been deleted (we do this because otherwise, we get the error message "You can only modify your own company")
                if (post.deletedAt) {
                    throw new ForbiddenException("Post not found or already deleted");
                }
                return true;
            }
        }

        return true;
    }
}
