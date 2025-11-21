import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post, PostSchema } from './post.schema';
import { UsersModule } from 'src/user/user.module';
import { PostCleanup } from './post.cleanup';

@Module({
    imports: [MongooseModule.forFeature([
            { name: Post.name, schema: PostSchema },
        ]),
        UsersModule,
    ],
    controllers: [PostController],
    providers: [PostService, PostCleanup],
    exports: [PostService],
})
export class PostModule {}
