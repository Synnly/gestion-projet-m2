import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersModule } from '../user/user.module';

@Module({
    imports: [UsersModule],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
