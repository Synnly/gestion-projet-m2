import { Module, forwardRef } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { UsersModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { ForumModule } from '../forum/forum.module';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Module({
    imports: [UsersModule, forwardRef(() => PostModule), forwardRef(() => ForumModule)],
    controllers: [CompanyController],
    providers: [CompanyService, PaginationService],
    exports: [CompanyService],
})
export class CompanyModule {}
