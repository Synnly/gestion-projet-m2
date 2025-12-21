import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [AdminModule],
    providers: [SeedService],
})
export class SeedModule {}
