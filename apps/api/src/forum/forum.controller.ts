import { Controller, Get, HttpCode, HttpStatus, Query, ValidationPipe } from '@nestjs/common';
import { ForumService } from './forum.service';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { PaginationResult } from '../common/pagination/dto/paginationResult';
import { ForumDto } from './dto/forum.dto';
import { plainToInstance } from 'class-transformer';

@Controller('/api/forum')
export class ForumController {
    constructor(private readonly forumService: ForumService) {}

    /**
     * Return a paginated list of forums. Query parameters `page` and `limit`
     * are read via `PaginationDto` and validated automatically.
     * @param query - Pagination parameters (page, limit)
     * @returns A paginated result containing `ForumDto` instances
     */
    @Get('all')
    @HttpCode(HttpStatus.OK)
    async findAllForums(
        @Query(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        query: PaginationDto,
    ): Promise<PaginationResult<ForumDto>> {
        const forums = await this.forumService.findAll(query);

        return {
            ...forums,
            data: forums.data.map((forum) => plainToInstance(ForumDto, forum)),
        };
    }
}
