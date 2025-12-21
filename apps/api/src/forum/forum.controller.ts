import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, Query, Put, UseGuards, Req } from '@nestjs/common';
import { TopicService } from './topic/topic.service';
import { CreateTopicDto } from './topic/dto/createTopic.dto';
import { UpdateTopicDto } from './topic/dto/updateTopic.dto';
import { Topic } from './topic/topic.schema';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { PaginationResult } from '../common/pagination/dto/paginationResult';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { ForumAccessGuard } from './guards/forum-access.guard';
import type { Request } from 'express';

@Controller('/api/forum')
export class ForumController {
    constructor(private readonly topicService: TopicService) {}

    @Get(':forumId/topics')
    async findAll(
        @Param('forumId') forumId: string,
        @Query() pagination: PaginationDto,
    ): Promise<PaginationResult<Topic>> {
        return this.topicService.findAll(forumId, pagination);
    }

    @Get(':forumId/topics/:id')
    async findOne(@Param('forumId') forumId: string, @Param('id') id: string): Promise<Topic | null> {
        return this.topicService.findOne(forumId, id);
    }

    @Post(':forumId/topics')
    @UseGuards(AuthGuard, RolesGuard, ForumAccessGuard)
    @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
    async create(@Param('forumId') forumId: string, @Body() dto: CreateTopicDto, @Req() req: Request): Promise<void> {
        const userId = req['user']?.id;
        await this.topicService.create(forumId, { ...dto, author: userId });
    }

    @Put(':forumId/topics/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.STUDENT, Role.COMPANY, Role.ADMIN)
    async update(
        @Param('forumId') forumId: string,
        @Param('id') id: string,
        @Body() dto: UpdateTopicDto | CreateTopicDto,
        @Req() req: Request,
    ): Promise<void> {
        // TODO: Vérifier que l'utilisateur est l'auteur du topic
        await this.topicService.update(forumId, id, dto);
    }
}
