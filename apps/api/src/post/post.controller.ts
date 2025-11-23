import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PostService } from './post.service';
import { PostDto } from './dto/post.dto';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { PostOwnerGuard } from './postOwner.guard';

/**
 * Controller handling post-related HTTP requests
 */
@UseGuards(AuthGuard)
@Controller('/api/posts')
export class PostController {
    constructor(private readonly postService: PostService) {}

    /**
     * Retrieves all posts
     * @returns An array of all posts
     */
    @Get('')
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<PostDto[]> {
        const posts = await this.postService.findAll();
        return plainToInstance(PostDto, posts);
    }

    /**
     * Retrieve a post by its id
     * @param id The post identifier
     * @returns The post with the specified ID
     */
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<PostDto> {
        const post = await this.postService.findOne(id);
        if (!post) throw new NotFoundException(`Post with id ${id} not found`);
        return new PostDto(post);
    }

    /**
     * Deletes a post
     * Requires authentication and COMPANY or ADMIN role
     * @param id The post identifier to delete
     */
    @Delete('/:id')
    @UseGuards(RolesGuard, PostOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseObjectIdPipe) id: string) {
        await this.postService.remove(id);
    }
}
