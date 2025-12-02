import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PostModule } from '../post/post.module';
import { StudentModule } from '../student/student.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from './application.schema';
import { S3Module } from '../s3/s3.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
        PostModule,
        StudentModule,
        S3Module,
    ],
    controllers: [ApplicationController],
    providers: [ApplicationService],
    exports: [ApplicationService],
})
export class ApplicationModule {}
