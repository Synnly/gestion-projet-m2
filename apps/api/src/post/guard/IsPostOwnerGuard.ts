import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { PostService } from '../post.service';

@Injectable()
export class PostOwnerGuard implements CanActivate {
    constructor(private readonly postsService: PostService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest();

        const user = request.user;

        const postId = (request.params.postId || request.body.postId) as string;

        if (!user || !user.sub) {
            return false;
        }

        if (user.role === 'ADMIN') {
            return true;
        }

        if (!postId) {
            // Si aucune ID de post n'est fournie, on peut laisser passer ou lever une erreur selon le contexte
            return true;
        }

        const isOwner = await this.isPostOwner(postId, user.sub);

        if (!isOwner) {
            // Alternativement, on pourrait lancer un ForbiddenException (403)
            throw new NotFoundException(`Post with ID ${postId} not found or access denied.`);
        }

        return true;
    }

    private async isPostOwner(postId: string, userId: string): Promise<boolean> {
        try {
            const post = await this.postsService.findOne(postId);
            if (!post) {
                return false;
            }
            return post.company._id.toString() === userId;
        } catch (error) {
            return false;
        }
    }
}
