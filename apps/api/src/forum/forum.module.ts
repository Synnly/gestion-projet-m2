import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { TopicService } from './topic/topic.service';
import { MessageService } from './message/message.service';
import { Forum, ForumSchema } from './forum.schema';
import { Topic, TopicSchema } from './topic/topic.schema';
import { PaginationService } from '../common/pagination/pagination.service';
import { GeoService } from '../common/geography/geo.service';
import { CompanyModule } from '../company/company.module';
import { Message, MessageSchema } from './message/message.schema';
import { NotificationModule } from '../notification/notification.module';
import { Report, ReportSchema } from './report/report.schema';
import { ReportService } from './report/report.service';
import { ReportController } from './report/report.controller';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Forum.name, schema: ForumSchema },
            { name: Topic.name, schema: TopicSchema },
            { name: Message.name, schema: MessageSchema },
            { name: Report.name, schema: ReportSchema },
        ]),
        forwardRef(() => CompanyModule),
        NotificationModule,
    ],
    controllers: [ForumController, ReportController],
    providers: [ForumService, TopicService, MessageService, ReportService, PaginationService, GeoService],
    exports: [ForumService, MessageService, TopicService, ReportService],
})
export class ForumModule {}
