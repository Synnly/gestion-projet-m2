import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
} from '@nestjs/common';
import { PostService } from './post.service';
import { PostDto } from './dto/post.dto';
import { ParseObjectIdPipe } from '../validators/parse-objectid.pipe';

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
        return posts.map((post) => new PostDto(post));
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<PostDto> {
        const post = await this.postService.findOne(id);
        if (!post) throw new NotFoundException(`Post with id ${id} not found`);
        return new PostDto(post);
    }

    @Post('')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: PostDto) {
        await this.postService.create(dto);
    }
}