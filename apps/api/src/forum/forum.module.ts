import { Module } from '@nestjs/common';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { TopicService } from './topic/topic.service';
import { MessageService } from './message/message.service';
import { PaginationService } from '../common/pagination/pagination.service';

@Module({
    imports: [],
    controllers: [ForumController],
    providers: [ForumService, TopicService, MessageService, PaginationService],
    exports: [],
})
export class ForumModule {}
