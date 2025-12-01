import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { UsersModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { S3Module } from '../s3/s3.module';
import { SchedulerRegistry } from '@nestjs/schedule';

@Module({
    imports: [
        UsersModule,
        PostModule,
        S3Module,
    ],
    controllers: [CompanyController],
    providers: [CompanyService, SchedulerRegistry],
    exports: [CompanyService],
})
export class CompanyModule {}
