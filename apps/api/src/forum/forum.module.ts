import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { TopicService } from './topic/topic.service';
import { MessageService } from './message/message.service';
import { Forum, ForumSchema } from './forum.schema';
import { PaginationService } from '../common/pagination/pagination.service';
import { GeoService } from '../common/geography/geo.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Forum.name, schema: ForumSchema }])],
    controllers: [ForumController],
    providers: [ForumService, TopicService, MessageService, PaginationService, GeoService],
    exports: [ForumService],
})
export class ForumModule {}
