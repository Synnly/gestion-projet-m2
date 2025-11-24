import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post, PostSchema } from './post.schema';
import { PaginationService } from '../common/pagination/pagination.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),],
    controllers: [PostController],
    providers: [PostService, PaginationService],
    exports: [PostService],
})
export class PostModule {}
