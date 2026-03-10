import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { UsersModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { ForumModule } from '../forum/forum.module';
import { ApplicationModule } from '../application/application.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { Post, PostSchema } from '../post/post.schema';
import { Application, ApplicationSchema } from '../application/application.schema';
import { Forum, ForumSchema } from '../forum/forum.schema';
import { Topic, TopicSchema } from '../forum/topic/topic.schema';
import { Message, MessageSchema } from '../forum/message/message.schema';
import { Report, ReportSchema } from '../forum/report/report.schema';
import { GeoService } from '../common/geography/geo.service';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        UsersModule,
        forwardRef(() => PostModule),
        forwardRef(() => ForumModule),
        forwardRef(() => ApplicationModule),
        NotificationModule,
        MongooseModule.forFeature([
            { name: Post.name, schema: PostSchema },
            { name: Application.name, schema: ApplicationSchema },
            { name: Forum.name, schema: ForumSchema },
            { name: Topic.name, schema: TopicSchema },
            { name: Message.name, schema: MessageSchema },
            { name: Report.name, schema: ReportSchema },
        ]),
        NotificationModule,
        forwardRef(() => AuthModule),
    ],
    controllers: [CompanyController],
    providers: [CompanyService, PaginationService, GeoService],
    exports: [CompanyService],
})
export class CompanyModule {}
