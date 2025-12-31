import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { UsersModule } from '../user/user.module';
import { CompanyModule } from '../company/company.module';
import { ApplicationModule } from '../application/application.module';
import { PostModule } from '../post/post.module';
import { ForumModule } from '../forum/forum.module';
import { StudentModule } from '../student/student.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from '../application/application.schema';
import { Post, PostSchema } from '../post/post.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Application.name, schema: ApplicationSchema },
            { name: Post.name, schema: PostSchema },
        ]),
        UsersModule,
        CompanyModule,
        ApplicationModule,
        PostModule,
        ForumModule,
        StudentModule,
    ],
    controllers: [StatsController],
    providers: [StatsService],
    exports: [StatsService],
})
export class StatsModule {}