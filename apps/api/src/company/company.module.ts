import { Module, forwardRef } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { UsersModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { ForumModule } from '../forum/forum.module';

@Module({
    imports: [UsersModule, forwardRef(() => PostModule), forwardRef(() => ForumModule)],
    controllers: [CompanyController],
    providers: [CompanyService],
    exports: [CompanyService],
})
export class CompanyModule {}
