import { Module, forwardRef } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { UsersModule } from '../user/user.module';
import { PostModule } from '../post/post.module';
import { ForumModule } from '../forum/forum.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { GeoService } from '../common/geography/geo.service';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        UsersModule,
        forwardRef(() => PostModule),
        forwardRef(() => ForumModule),
        NotificationModule,
        forwardRef(() => AuthModule),
    ],
    controllers: [CompanyController],
    providers: [CompanyService, PaginationService, GeoService],
    exports: [CompanyService],
})
export class CompanyModule {}
