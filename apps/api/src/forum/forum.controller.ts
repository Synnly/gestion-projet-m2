import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, Query, Put } from '@nestjs/common';
import { TopicService } from './topic/topic.service';
import { CreateTopicDto } from './topic/dto/createTopic.dto';
import { UpdateTopicDto } from './topic/dto/updateTopic.dto';
import { Topic } from './topic/topic.schema';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { PaginationResult } from '../common/pagination/dto/paginationResult';

@Controller('/api/forum')
export class ForumController {
    constructor(private readonly topicService: TopicService) {}

    @Get(':forumId/topics')
    async findAll(@Param('forumId') forumId: string, @Query() pagination: PaginationDto): Promise<PaginationResult<Topic>> {
        return this.topicService.findAll(forumId, pagination);
    }

    @Get(':forumId/topics/:id')
    async findOne(@Param('forumId') forumId: string, @Param('id') id: string): Promise<Topic | null> {
        return this.topicService.findOne(forumId, id);
    }

    @Post(':forumId/topics')
    async create(@Param('forumId') forumId: string, @Body() dto: CreateTopicDto): Promise<void> {
        await this.topicService.create(forumId, dto);
    }

    @Put(':forumId/topics/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(@Param('forumId') forumId: string, @Param('id') id: string, @Body() dto: UpdateTopicDto | CreateTopicDto): Promise<void> {
        await this.topicService.update(forumId, id, dto);
    }
}