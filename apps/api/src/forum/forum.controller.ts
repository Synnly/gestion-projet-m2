import { Controller, Get, Post, Patch, Param, Body, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { TopicService } from './topic/topic.service';
import { CreateTopicDto } from './topic/dto/createTopic.dto';
import { UpdateTopicDto } from './topic/dto/updateTopic.dto';
import { Topic } from './topic/topic.schema';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { PaginationResult } from '../common/pagination/dto/paginationResult';

@Controller('/api/forum')
export class ForumController {
    constructor(private readonly topicService: TopicService) {}

    @Get('topics')
    async findAll(@Query() pagination: PaginationDto): Promise<PaginationResult<Topic>> {
        return this.topicService.findAll(pagination);
    }

    @Get('topics/:id')
    async findOne(@Param('id') id: string): Promise<Topic | null> {
        return this.topicService.findOne(id);
    }

    @Post('topics')
    async create(@Body() dto: CreateTopicDto): Promise<void> {
        await this.topicService.create(dto);
    }

    @Patch('topics/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(@Param('id') id: string, @Body() dto: UpdateTopicDto | CreateTopicDto): Promise<void> {
        await this.topicService.update(id, dto as any);
    }
}
