import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { TopicService } from './topic/topic.service';
import { MessageService } from './message/message.service';
import { Forum, ForumSchema } from './forum.schema';
import { PaginationService } from '../common/pagination/pagination.service';
import { GeoService } from '../common/geography/geo.service';
import { CompanyModule } from '../company/company.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Forum.name, schema: ForumSchema }]), forwardRef(() => CompanyModule)],
    controllers: [ForumController],
    providers: [ForumService, TopicService, MessageService, PaginationService, GeoService, MessageService],
    exports: [ForumService, MessageService],
})
export class ForumModule {}
