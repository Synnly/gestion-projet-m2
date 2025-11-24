import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post, PostSchema } from './post.schema';
import { UsersModule } from '../user/user.module';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PaginationService } from '../common/pagination/pagination.service';

@Module({
    imports: [MongooseModule.forFeature([
            { name: Post.name, schema: PostSchema },
        ]),
        UsersModule,
    ],
    controllers: [PostController],
    providers: [PostService, PaginationService, SchedulerRegistry],
    exports: [PostService],
})
export class PostModule {}
