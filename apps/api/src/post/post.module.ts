import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post, PostSchema } from './post.schema';
import { UsersModule } from 'src/user/user.module';

@Module({
    imports: [MongooseModule.forFeature([
            { name: Post.name, schema: PostSchema },
        ]),
        UsersModule,
    ],
    controllers: [PostController],
    providers: [PostService],
    exports: [PostService],
})
export class PostModule {}
