import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Put,
    UseGuards,
    ValidationPipe,
    Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { PostDto } from './dto/post.dto';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { CreatePostDto } from './dto/createPost.dto';
import { CompanyOwnerGuard } from '../common/roles/companyOwner.guard';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { PaginationResult } from 'src/common/pagination/dto/paginationResult';
import { plainToInstance } from 'class-transformer';
import { UpdatePostDto } from './dto/updatePost';

/**
 * Controller responsible for handling post-related endpoints.
 */
@Controller('/api/company/:companyId/posts')
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
     * Create a new post for the given company. This endpoint is protected
     * and only accessible to authenticated users with the `COMPANY` or
     * `ADMIN` role that are owners of the company.
     *
     * @param companyId - Company id (MongoDB ObjectId string)
     * @param dto - Payload validated by `CreatePostDto`
     */
    @Post('')
    @UseGuards(AuthGuard, RolesGuard, CompanyOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Param('companyId', ParseObjectIdPipe) companyId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) dto: CreatePostDto,
    ) {
        await this.postService.create(dto, companyId);
    }

    /**
     * Updates an existing post
     * @param companyId The company identifier
     * @param id The post identifier
     * @param dto The post data for update
     */
    @Put('/:id')
    @UseGuards(RolesGuard, CompanyOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('companyId', ParseObjectIdPipe) companyId: string,
        @Param('id', ParseObjectIdPipe) id: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) dto: UpdatePostDto,
    ) {
        const updated = await this.postService.update(dto, companyId, id);
        return plainToInstance(PostDto, updated);
    }
}
