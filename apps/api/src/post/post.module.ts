import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post, PostSchema } from './post.schema';
import { PaginationService } from '../common/pagination/pagination.service';
import { GeoService } from 'src/common/geography/geo.service';
import { CompanyModule } from 'src/company/company.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]), forwardRef(() => CompanyModule)],
    controllers: [PostController],
    providers: [PostService, PaginationService, GeoService],
    exports: [PostService],
})
export class PostModule {}
