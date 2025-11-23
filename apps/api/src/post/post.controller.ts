import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    UseGuards,
    ValidationPipe,
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
import { plainToInstance } from 'class-transformer';

/**
 * Controller handling post-related HTTP requests
 */
@UseGuards(AuthGuard)
@Controller('/api/company/:companyId/posts')
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
        return posts.map((post) => plainToInstance(PostDto, post));
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
        return plainToInstance(PostDto, post);
    }

    /**
     * Creates a new post
     * @param companyId The company identifier
     * @param dto The post data for creation
     */
    @Post('')
    @UseGuards(RolesGuard, CompanyOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Param('companyId', ParseObjectIdPipe) companyId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) dto: CreatePostDto,
    ) {
        await this.postService.create(dto, companyId);
    }
}
