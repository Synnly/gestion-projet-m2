import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    UseGuards,
    ValidationPipe,
    Query,
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
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { PaginationResult } from 'src/common/pagination/dto/paginationResult';

/**
 * Controller responsible for handling post-related endpoints.
 */
@UseGuards(AuthGuard)
@Controller('/api/posts')
export class PostController {
    constructor(private readonly postService: PostService) {}

    /**
     * Return a paginated list of posts. Query parameters `page` and `limit`
     * are read via `PaginationDto` and validated automatically.
     *
     * @param query - Pagination parameters (page, limit)
     * @returns A paginated result containing `PostDto` instances
     */
    @Get('')
    @HttpCode(HttpStatus.OK)
    async findAll(
        @Query(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        query: PaginationDto,
    ): Promise<PaginationResult<PostDto>> {
        const posts = await this.postService.findAll(query);
        return {
            ...posts,
            data: posts.data.map((post) => plainToInstance(PostDto, post)),
        };
    }

    /**
     *
     * Retrieve a single post by its identifier. If the post does not exist
     * a `NotFoundException` is thrown which maps to a 404 response.
     *
     * @param id - The post identifier (MongoDB ObjectId string)
     * @throws NotFoundException if the post is not found
     * @returns The found post converted to `PostDto`
     */
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<PostDto> {
        const post = await this.postService.findOne(id);
        if (!post) throw new NotFoundException(`Post with id ${id} not found`);
        return plainToInstance(PostDto, post);
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
