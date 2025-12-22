import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { Request } from 'express';
import { Types } from 'mongoose';

import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { PaginationResult } from '../common/pagination/dto/paginationResult';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';

import { ForumService } from './forum.service';
import { ForumDto } from './dto/forum.dto';
import { ForumAccessGuard } from './guards/forum-access.guard';
import { TopicService } from './topic/topic.service';
import { Topic } from './topic/topic.schema';
import { CreateTopicDto } from './topic/dto/createTopic.dto';
import { UpdateTopicDto } from './topic/dto/updateTopic.dto';

@UseGuards(AuthGuard)
@Controller('/api/forum')
export class ForumController {
    constructor(
        private readonly forumService: ForumService,
        private readonly topicService: TopicService,
    ) {}

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

    /**
     * Find the general forum (without a company id).
     * @returns The general forum if found, otherwise null.
     */
    @Get('general')
    @HttpCode(HttpStatus.OK)
    async getGeneralForum(): Promise<ForumDto | null> {
        return plainToInstance(ForumDto, await this.forumService.findOneByCompanyId());
    }

    /**
     * Find a forum by company id.
     * @param companyId - The company id to search for. If not provided, searches for the general forum.
     * @returns The forum if found, otherwise null.
     */
    @Get('by-company-id/:companyId')
    @HttpCode(HttpStatus.OK)
    async findOneByCompanyId(@Param('companyId', ParseObjectIdPipe) companyId?: string): Promise<ForumDto | null> {
        return plainToInstance(ForumDto, await this.forumService.findOneByCompanyId(companyId));
    }

    /**
     * Find all topics in a forum with pagination.
     * @param forumId - The forum id
     * @param pagination - Pagination parameters
     * @returns A paginated result containing `Topic` instances
     */
    @Get(':forumId/topics')
    async findAll(
        @Param('forumId') forumId: string,
        @Query() pagination: PaginationDto,
    ): Promise<PaginationResult<Topic>> {
        return this.topicService.findAll(forumId, pagination);
    }

    /**
     * Find a specific topic in a forum.
     * @param forumId - The forum id
     * @param id - The topic id
     * @returns The topic if found, otherwise null
     */
    @Get(':forumId/topics/:id')
    async findOne(@Param('forumId') forumId: string, @Param('id') id: string): Promise<Topic | null> {
        return this.topicService.findOne(forumId, id);
    }

    /**
     * Create a new topic in a forum.
     * @param forumId - The forum id
     * @param dto - Data transfer object containing topic details
     * @param req - The request object containing user information
     */
    @Post(':forumId/topics')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RolesGuard, ForumAccessGuard)
    @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
    async create(@Param('forumId') forumId: string, @Body() dto: CreateTopicDto, @Req() req: Request): Promise<void> {
        const userId = new Types.ObjectId(req.user?.sub);
        await this.topicService.create(forumId, { ...dto, author: userId });
    }

    /**
     * Update an existing topic in a forum.
     * @param forumId - The forum id
     * @param id - The topic id
     * @param dto - Data transfer object containing updated topic details
     * @param req - The request object containing user information
     */
    @Put(':forumId/topics/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(RolesGuard, ForumAccessGuard)
    @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
    async update(
        @Param('forumId') forumId: string,
        @Param('id') id: string,
        @Body() dto: UpdateTopicDto | CreateTopicDto,
        @Req() req: Request,
    ): Promise<void> {
        await this.topicService.update(forumId, id, dto);
    }
}
