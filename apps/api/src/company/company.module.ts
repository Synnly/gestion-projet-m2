import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { UsersModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { ForumModule } from '../forum/forum.module';
import { NotificationModule } from '../notification/notification.module';
import { ApplicationModule } from '../application/application.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { Post, PostSchema } from '../post/post.schema';
import { Application, ApplicationSchema } from '../application/application.schema';
import { Forum, ForumSchema } from '../forum/forum.schema';
import { Topic, TopicSchema } from '../forum/topic/topic.schema';
import { Message, MessageSchema } from '../forum/message/message.schema';

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
        ]),
    ],
    controllers: [CompanyController],
    providers: [CompanyService, PaginationService],
    exports: [CompanyService],
})
export class CompanyModule {}
