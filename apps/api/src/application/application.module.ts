import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PostModule } from '../post/post.module';
import { StudentModule } from '../student/student.module';

@Module({
    imports: [PostModule, StudentModule],
    controllers: [ApplicationController],
    providers: [ApplicationService],
    exports: [ApplicationService],
})
export class ApplicationModule {}
