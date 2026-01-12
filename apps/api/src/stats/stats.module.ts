import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../user/user.module';

import { Application, ApplicationSchema } from '../application/application.schema';
import { Post, PostSchema } from '../post/post.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Application.name, schema: ApplicationSchema },
            { name: Post.name, schema: PostSchema },
        ]),
     
       UsersModule, 
    ],
    controllers: [StatsController],
    providers: [StatsService],
    exports: [StatsService],
})
export class StatsModule {}