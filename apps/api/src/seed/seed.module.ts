import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { AdminModule } from '../admin/admin.module';
import { ForumModule } from '../forum/forum.module';

@Module({
    imports: [AdminModule, ForumModule],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule {}
