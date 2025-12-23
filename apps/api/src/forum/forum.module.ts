import { Module } from '@nestjs/common';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { TopicService } from './topic/topic.service';
import { MessageService } from './message/message.service';

@Module({
    imports: [],
    controllers: [ForumController],
    providers: [ForumService, TopicService, MessageService],
    exports: [],
})
export class ForumModule {}
